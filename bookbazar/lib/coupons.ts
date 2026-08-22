import "server-only"
import type { Prisma } from "@/lib/generated/prisma/client"

export class CouponError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "CouponError"
  }
}

type TxClient = Prisma.TransactionClient

/**
 * Validates a coupon code against a buyer + order total and returns the
 * rupee discount it's worth. Throws CouponError with a user-facing message
 * on any failure — the caller (checkout preview, or order/create) decides
 * how to surface that. Never mutates anything; redeemCoupon does that.
 */
export async function evaluateCoupon(
  tx: TxClient,
  params: { code: string; userId: string; orderTotal: number }
) {
  const coupon = await tx.coupon.findUnique({ where: { code: params.code.trim().toUpperCase() } })

  if (!coupon || !coupon.isActive) {
    throw new CouponError("This coupon code isn't valid")
  }
  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    throw new CouponError("This coupon has expired")
  }
  if (coupon.maxRedemptions !== null && coupon.redeemedCount >= coupon.maxRedemptions) {
    throw new CouponError("This coupon has reached its usage limit")
  }
  if (coupon.minOrderAmount && params.orderTotal < Number(coupon.minOrderAmount)) {
    throw new CouponError(`This coupon requires a minimum order of Rs. ${coupon.minOrderAmount}`)
  }
  if (coupon.firstOrderOnly) {
    const priorOrders = await tx.order.count({ where: { buyerId: params.userId } })
    if (priorOrders > 0) {
      throw new CouponError("This coupon is only valid on your first order")
    }
  }
  const alreadyUsed = await tx.couponRedemption.findFirst({ where: { couponId: coupon.id, userId: params.userId } })
  if (alreadyUsed) {
    throw new CouponError("You've already used this coupon")
  }

  let discount =
    coupon.type === "PERCENTAGE" ? (params.orderTotal * Number(coupon.value)) / 100 : Number(coupon.value)

  if (coupon.maxDiscount) discount = Math.min(discount, Number(coupon.maxDiscount))
  discount = Math.min(discount, params.orderTotal) // never discount more than the order is worth
  discount = Math.round(discount * 100) / 100

  return { coupon, discount }
}

/**
 * Actually spends the coupon — call only from inside the same transaction
 * that creates the order, after evaluateCoupon confirmed it's valid. The
 * redemption count bump is a conditional UPDATE (mirrors the credit
 * ledger's balance guard) so two concurrent redemptions can't both slip
 * past a maxRedemptions cap neither of them actually had room for.
 */
export async function redeemCoupon(
  tx: TxClient,
  params: { couponId: string; userId: string; orderId: string; amount: number; maxRedemptions: number | null }
) {
  if (params.maxRedemptions !== null) {
    const result = await tx.coupon.updateMany({
      where: { id: params.couponId, redeemedCount: { lt: params.maxRedemptions } },
      data: { redeemedCount: { increment: 1 } },
    })
    if (result.count === 0) {
      throw new CouponError("This coupon just reached its usage limit")
    }
  } else {
    await tx.coupon.update({ where: { id: params.couponId }, data: { redeemedCount: { increment: 1 } } })
  }

  await tx.couponRedemption.create({
    data: { couponId: params.couponId, userId: params.userId, orderId: params.orderId, amount: params.amount },
  })
}
