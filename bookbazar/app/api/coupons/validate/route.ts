import prisma from "@/lib/prisma"
import { requireActiveUser } from "@/app/lib/active-user"
import { evaluateCoupon, CouponError } from "@/lib/coupons"
import { z } from "zod"

const schema = z.object({
  code: z.string().min(1),
  orderTotal: z.number().positive(),
})

// Checkout preview only — doesn't redeem anything. The real, authoritative
// check happens again inside order/create's transaction, since a coupon's
// validity (max redemptions, first-order status) can change between this
// preview and the moment the order actually gets placed.
export async function POST(req: Request) {
  const { error, user } = await requireActiveUser()
  if (error) return error

  const result = schema.safeParse(await req.json())
  if (!result.success) {
    return Response.json({ message: "Invalid data" }, { status: 400 })
  }

  try {
    const { coupon, discount } = await evaluateCoupon(prisma, {
      code: result.data.code,
      userId: user.id,
      orderTotal: result.data.orderTotal,
    })
    return Response.json({
      valid: true,
      discount,
      description: coupon.description,
      type: coupon.type,
      value: coupon.value,
    })
  } catch (err) {
    if (err instanceof CouponError) {
      return Response.json({ valid: false, message: err.message }, { status: 400 })
    }
    throw err
  }
}
