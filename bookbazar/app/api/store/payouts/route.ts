import prisma from "@/lib/prisma"
import { requireActiveUser } from "@/app/lib/active-user"

// So a seller can actually see "BookMandu owes me X for discounts buyers
// used on my orders" instead of just noticing they collected less COD
// cash than the order total and wondering why.
export async function GET() {
  const { error, user } = await requireActiveUser()
  if (error) return error

  const store = await prisma.store.findUnique({ where: { sellerId: user.id } })
  if (!store) {
    return Response.json({ adjustments: [], totalOwed: 0 })
  }

  const adjustments = await prisma.sellerPayoutAdjustment.findMany({
    where: { storeId: store.id },
    include: { order: { select: { createdAt: true, couponCode: true } } },
    orderBy: { createdAt: "desc" },
  })

  const totalOwed = adjustments
    .filter((a) => a.status === "PENDING")
    .reduce((sum, a) => sum + Number(a.amount), 0)

  return Response.json({ adjustments, totalOwed })
}
