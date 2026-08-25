import prisma from "@/lib/prisma";
import { randomInt } from "crypto";
import { requireActiveUser } from "@/app/lib/active-user";
import { applyCreditTransaction, getCreditSettings, InsufficientCreditsError } from "@/lib/credits";
import { evaluateCoupon, redeemCoupon, CouponError } from "@/lib/coupons";
import { allocatePayoutAdjustments } from "@/lib/seller-payouts";
import { z } from "zod";

export const orderSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  shippingAddr: z.string().min(5, "Address is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  postalCode: z.string().min(4, "Postal code is required"),
  notes: z.string().optional(),
  // The buyer's requested amount — never trusted for its rupee value.
  // Server re-derives what it's actually worth and clamps it to what the
  // buyer can really afford and what the order can really absorb.
  creditsToApply: z.number().int().min(0).optional(),
  couponCode: z.string().min(1).optional(),
});

class OrderCreationError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export async function POST(req: Request) {
  const { error, user } = await requireActiveUser()

  if (error) {
    return error
  }

  const body = await req.json()
  const schema = orderSchema.safeParse(body)

  if (!schema.success) {
    return Response.json({ message: schema.error.flatten() }, { status: 400 })
  }

  const { fullName, phone, shippingAddr, city, state, postalCode, notes, creditsToApply, couponCode } = schema.data

  const deliveryCode = String(randomInt(100000, 1000000))

  try {
    const result = await prisma.$transaction(async (tx) => {
      const cartItems = await tx.cartItem.findMany({
        where: {
          userId: user.id,
          book: { isActive: true, store: { isActive: true, isApproved: true } },
        },
        include: { book: true },
      })

      if (cartItems.length === 0) {
        throw new OrderCreationError("Cart is empty")
      }

      const total = cartItems.reduce((sum, item) => sum + item.quantity * Number(item.book.price), 0)

      // Coupon applies first — it reduces the amount credits then have
      // room to cover, same order a cashier would apply a discount before
      // asking "how much store credit do you want to use."
      let couponDiscount = 0
      let couponRecord: Awaited<ReturnType<typeof evaluateCoupon>>["coupon"] | null = null
      if (couponCode) {
        const evaluated = await evaluateCoupon(tx, { code: couponCode, userId: user.id, orderTotal: total })
        couponDiscount = evaluated.discount
        couponRecord = evaluated.coupon
      }
      const totalAfterCoupon = total - couponDiscount

      // Credits to apply — clamped server-side to the rupee value left on
      // the order AND the buyer's real balance, so a request for more than
      // the buyer actually has just clamps down instead of failing the
      // whole order. applyCreditTransaction's atomic update is still the
      // real guard against a same-millisecond race (balance changing
      // between this read and the debit below), not the primary path.
      let creditsUsed = 0
      let creditsRupeeValue = 0
      if (creditsToApply && creditsToApply > 0) {
        const [settings, buyer] = await Promise.all([
          getCreditSettings(tx),
          tx.user.findUniqueOrThrow({ where: { id: user.id }, select: { creditBalance: true } }),
        ])
        const creditValue = Number(settings.creditValueInRupees)
        const maxByTotal = creditValue > 0 ? Math.floor(totalAfterCoupon / creditValue) : 0
        creditsUsed = Math.min(creditsToApply, maxByTotal, buyer.creditBalance)
        creditsRupeeValue = Math.round(creditsUsed * creditValue * 100) / 100
      }

      const order = await tx.order.create({
        data: {
          buyerId: user.id,
          fullName,
          totalAmount: total,
          creditsApplied: creditsRupeeValue,
          couponCode: couponRecord?.code ?? null,
          couponDiscount,
          deliveryCode,
          phone,
          shippingAddr,
          city,
          state,
          postalCode,
          notes,
        },
      })

      if (couponRecord) {
        await redeemCoupon(tx, {
          couponId: couponRecord.id,
          userId: user.id,
          orderId: order.id,
          amount: couponDiscount,
          maxRedemptions: couponRecord.maxRedemptions,
        })
      }

      const orderItemsData = cartItems.map((item) => ({
        orderId: order.id,
        bookId: item.bookId,
        storeId: item.book.storeId,
        quantity: item.quantity,
        unitPrice: item.book.price,
        totalPrice: Number(item.book.price) * item.quantity,
      }))
      await tx.orderItem.createMany({ data: orderItemsData })

      // BookMandu's promotions (coupons, credits) are BookMandu's cost,
      // not the seller's — this is what actually tracks that, split
      // proportionally across sellers when an order spans more than one.
      await allocatePayoutAdjustments(tx, {
        orderId: order.id,
        items: orderItemsData.map((i) => ({ storeId: i.storeId, totalPrice: i.totalPrice })),
        totalDiscount: couponDiscount + creditsRupeeValue,
      })

      // Atomic per-book stock check-and-decrement — two buyers racing for
      // the last copy can't both succeed past a stock level neither of
      // them actually saw, the same conditional-update pattern used for
      // the credit ledger below.
      for (const item of cartItems) {
        const decremented = await tx.book.updateMany({
          where: { id: item.bookId, stockQty: { gte: item.quantity } },
          data: { stockQty: { decrement: item.quantity } },
        })
        if (decremented.count === 0) {
          throw new OrderCreationError(`Insufficient stock for "${item.book.title}"`)
        }
      }

      await tx.cartItem.deleteMany({ where: { userId: user.id } })

      if (creditsUsed > 0) {
        await applyCreditTransaction(tx, {
          userId: user.id,
          amount: -creditsUsed,
          type: "BOOK_REDEMPTION",
          reason: `Applied to order`,
          referenceType: "Order",
          referenceId: order.id,
        })
      }

      return { order, creditsUsed, creditsRupeeValue, couponDiscount }
    })

    return Response.json(
      {
        message: "Order created successfully",
        order: { ...result.order, deliveryCode },
        deliveryCode,
        creditsApplied: result.creditsRupeeValue,
        creditsUsed: result.creditsUsed,
        couponDiscount: result.couponDiscount,
        amountDue: Number(result.order.totalAmount) - result.creditsRupeeValue - result.couponDiscount,
      },
      { status: 201 }
    )
  } catch (err) {
    if (err instanceof OrderCreationError) {
      return Response.json({ message: err.message }, { status: err.status })
    }
    if (err instanceof InsufficientCreditsError) {
      return Response.json({ message: "Your credit balance changed — please try again" }, { status: 409 })
    }
    if (err instanceof CouponError) {
      return Response.json({ message: err.message }, { status: 400 })
    }
    console.error("ORDER CREATE ERROR:", err)
    return Response.json({ message: "Unable to place order, please try again" }, { status: 500 })
  }
}
