import prisma from "@/lib/prisma";
import { randomInt } from "crypto";
import { requireActiveUser } from "@/app/lib/active-user";
import { applyCreditTransaction, getCreditSettings, InsufficientCreditsError } from "@/lib/credits";
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

  const { fullName, phone, shippingAddr, city, state, postalCode, notes, creditsToApply } = schema.data

  const deliveryCode = String(randomInt(100000, 1000000))

  try {
    const result = await prisma.$transaction(async (tx) => {
      const cartItems = await tx.cartItem.findMany({
        where: {
          userId: user.id,
          book: { isActive: true, store: { isActive: true } },
        },
        include: { book: true },
      })

      if (cartItems.length === 0) {
        throw new OrderCreationError("Cart is empty")
      }

      const total = cartItems.reduce((sum, item) => sum + item.quantity * Number(item.book.price), 0)

      // Credits to apply — clamped server-side to the rupee value of the
      // order AND the buyer's real balance, so a request for more than the
      // buyer actually has just clamps down instead of failing the whole
      // order. applyCreditTransaction's atomic update is still the real
      // guard against a same-millisecond race (balance changing between
      // this read and the debit below), not the primary path.
      let creditsUsed = 0
      let creditsRupeeValue = 0
      if (creditsToApply && creditsToApply > 0) {
        const [settings, buyer] = await Promise.all([
          getCreditSettings(tx),
          tx.user.findUniqueOrThrow({ where: { id: user.id }, select: { creditBalance: true } }),
        ])
        const creditValue = Number(settings.creditValueInRupees)
        const maxByTotal = creditValue > 0 ? Math.floor(total / creditValue) : 0
        creditsUsed = Math.min(creditsToApply, maxByTotal, buyer.creditBalance)
        creditsRupeeValue = Math.round(creditsUsed * creditValue * 100) / 100
      }

      const order = await tx.order.create({
        data: {
          buyerId: user.id,
          fullName,
          totalAmount: total,
          creditsApplied: creditsRupeeValue,
          deliveryCode,
          phone,
          shippingAddr,
          city,
          state,
          postalCode,
          notes,
        },
      })

      await tx.orderItem.createMany({
        data: cartItems.map((item) => ({
          orderId: order.id,
          bookId: item.bookId,
          storeId: item.book.storeId,
          quantity: item.quantity,
          unitPrice: item.book.price,
          totalPrice: Number(item.book.price) * item.quantity,
        })),
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

      return { order, creditsUsed, creditsRupeeValue }
    })

    return Response.json(
      {
        message: "Order created successfully",
        order: { ...result.order, deliveryCode },
        deliveryCode,
        creditsApplied: result.creditsRupeeValue,
        creditsUsed: result.creditsUsed,
        amountDue: Number(result.order.totalAmount) - result.creditsRupeeValue,
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
    console.error("ORDER CREATE ERROR:", err)
    return Response.json({ message: "Unable to place order, please try again" }, { status: 500 })
  }
}
