import prisma from "@/lib/prisma"
import { requireActiveUser } from "@/app/lib/active-user"
import { getCreditSettings } from "@/lib/credits"

// Any logged-in user can hold credits (not just contributors — an admin
// manual adjustment can grant them to anyone), so this isn't gated to
// contributor status.
export async function GET() {
  const { error, user } = await requireActiveUser()
  if (error) return error

  const [me, transactions, settings] = await Promise.all([
    prisma.user.findUnique({ where: { id: user.id }, select: { creditBalance: true } }),
    prisma.creditTransaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    getCreditSettings(),
  ])

  return Response.json({
    balance: me?.creditBalance ?? 0,
    creditValueInRupees: settings.creditValueInRupees,
    transactions,
  })
}
