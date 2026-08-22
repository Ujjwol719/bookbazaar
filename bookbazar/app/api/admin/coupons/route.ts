import prisma from "@/lib/prisma"
import { requireAdmin } from "@/app/lib/require-admin"
import { z } from "zod"

const createSchema = z.object({
  code: z.string().min(3).max(30),
  type: z.enum(["PERCENTAGE", "FIXED"]),
  value: z.number().positive(),
  description: z.string().max(200).optional(),
  firstOrderOnly: z.boolean().optional(),
  minOrderAmount: z.number().positive().optional(),
  maxDiscount: z.number().positive().optional(),
  maxRedemptions: z.number().int().positive().optional(),
  expiresAt: z.string().datetime().optional(),
})

export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error

  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } })
  return Response.json({ coupons })
}

export async function POST(req: Request) {
  const { error } = await requireAdmin()
  if (error) return error

  const result = createSchema.safeParse(await req.json())
  if (!result.success) {
    return Response.json({ message: "Invalid data", errors: result.error.flatten() }, { status: 400 })
  }
  const data = result.data
  const code = data.code.trim().toUpperCase()

  if (data.type === "PERCENTAGE" && data.value > 100) {
    return Response.json({ message: "A percentage coupon can't exceed 100%" }, { status: 400 })
  }

  const existing = await prisma.coupon.findUnique({ where: { code } })
  if (existing) {
    return Response.json({ message: "A coupon with this code already exists" }, { status: 409 })
  }

  const coupon = await prisma.coupon.create({
    data: {
      code,
      type: data.type,
      value: data.value,
      description: data.description || null,
      firstOrderOnly: data.firstOrderOnly ?? false,
      minOrderAmount: data.minOrderAmount ?? null,
      maxDiscount: data.maxDiscount ?? null,
      maxRedemptions: data.maxRedemptions ?? null,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
    },
  })

  return Response.json({ coupon }, { status: 201 })
}
