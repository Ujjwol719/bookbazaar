import prisma from "@/lib/prisma"
import { requireAdmin } from "@/app/lib/require-admin"

// Marks a payout adjustment as settled — this records that the admin
// actually sent the seller the money (bank transfer, etc.), it doesn't
// move any money itself. No payment gateway exists to automate that yet.
export async function PATCH(_req: Request, context: { params: Promise<{ id: string }> }) {
  const { error, payload } = await requireAdmin()
  if (error) return error

  const { id } = await context.params
  const adjustment = await prisma.sellerPayoutAdjustment.findUnique({ where: { id } })
  if (!adjustment) {
    return Response.json({ message: "Adjustment not found" }, { status: 404 })
  }
  if (adjustment.status === "PAID") {
    return Response.json({ message: "Already marked as paid" }, { status: 409 })
  }

  const updated = await prisma.sellerPayoutAdjustment.update({
    where: { id },
    data: { status: "PAID", paidAt: new Date(), paidById: payload!.id as string },
  })

  return Response.json({ message: "Marked as paid", adjustment: updated })
}
