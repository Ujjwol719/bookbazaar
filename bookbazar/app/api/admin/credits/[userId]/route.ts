import prisma from "@/lib/prisma"
import { requireAdmin } from "@/app/lib/require-admin"

export async function GET(_req: Request, context: { params: Promise<{ userId: string }> }) {
  const { error } = await requireAdmin()
  if (error) return error

  const { userId } = await context.params
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, full_name: true, email: true, creditBalance: true },
  })
  if (!user) {
    return Response.json({ message: "User not found" }, { status: 404 })
  }

  const transactions = await prisma.creditTransaction.findMany({
    where: { userId },
    include: { createdBy: { select: { full_name: true } } },
    orderBy: { createdAt: "desc" },
  })

  return Response.json({ user, transactions })
}
