import prisma from "@/lib/prisma"
import { requireAdmin } from "@/app/lib/require-admin"
import { z } from "zod"

const patchSchema = z.object({
  isActive: z.boolean().optional(),
  description: z.string().max(200).optional(),
  maxRedemptions: z.number().int().positive().nullable().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
})

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin()
  if (error) return error

  const { id } = await context.params
  const result = patchSchema.safeParse(await req.json())
  if (!result.success) {
    return Response.json({ message: "Invalid data" }, { status: 400 })
  }

  const coupon = await prisma.coupon.findUnique({ where: { id } })
  if (!coupon) {
    return Response.json({ message: "Coupon not found" }, { status: 404 })
  }

  const { expiresAt, ...rest } = result.data
  const updated = await prisma.coupon.update({
    where: { id },
    data: { ...rest, ...(expiresAt !== undefined ? { expiresAt: expiresAt ? new Date(expiresAt) : null } : {}) },
  })

  return Response.json({ coupon: updated })
}

// Only deletable with zero redemptions — otherwise it'd break the audit
// trail on real orders. Deactivate (isActive: false) instead.
export async function DELETE(_req: Request, context: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin()
  if (error) return error

  const { id } = await context.params
  const coupon = await prisma.coupon.findUnique({ where: { id } })
  if (!coupon) {
    return Response.json({ message: "Coupon not found" }, { status: 404 })
  }
  if (coupon.redeemedCount > 0) {
    return Response.json({ message: "This coupon has been used — deactivate it instead of deleting" }, { status: 409 })
  }

  await prisma.coupon.delete({ where: { id } })
  return Response.json({ message: "Coupon deleted" })
}
