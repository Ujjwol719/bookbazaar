import prisma from "@/lib/prisma"
import { requireAdmin } from "@/app/lib/require-admin"

export async function GET(req: Request) {
  const { error } = await requireAdmin()
  if (error) return error

  const statusParam = new URL(req.url).searchParams.get("status")
  const status = statusParam === "PAID" ? "PAID" : statusParam === "PENDING" ? "PENDING" : undefined

  const adjustments = await prisma.sellerPayoutAdjustment.findMany({
    where: status ? { status } : undefined,
    include: {
      store: { select: { name: true, slug: true, phone: true } },
      order: { select: { id: true, createdAt: true, couponCode: true } },
      paidBy: { select: { full_name: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return Response.json({ adjustments })
}
