import prisma from "@/lib/prisma"
import { requireAdmin } from "@/app/lib/require-admin"

// Users with any credit activity — a balance now, or a ledger row ever
// (covers someone who redeemed everything down to zero).
export async function GET(req: Request) {
  const { error } = await requireAdmin()
  if (error) return error

  const q = new URL(req.url).searchParams.get("q")?.trim()

  const users = await prisma.user.findMany({
    where: {
      AND: [
        { OR: [{ creditBalance: { gt: 0 } }, { creditTransactions: { some: {} } }] },
        ...(q ? [{ OR: [{ email: { contains: q, mode: "insensitive" as const } }, { full_name: { contains: q, mode: "insensitive" as const } }] }] : []),
      ],
    },
    select: { id: true, full_name: true, email: true, creditBalance: true },
    orderBy: { creditBalance: "desc" },
    take: 100,
  })

  return Response.json({ users })
}
