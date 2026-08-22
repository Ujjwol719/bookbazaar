import prisma from "@/lib/prisma"
import { requireAdmin } from "@/app/lib/require-admin"
import { applyCreditTransaction, InsufficientCreditsError } from "@/lib/credits"
import { z } from "zod"

// Every manual credit change goes through here — never a direct
// User.creditBalance write — so it's always ledger-backed with a reason an
// admin can read back later.
const adjustSchema = z.object({
  userId: z.string().min(1),
  amount: z.number().int().refine((n) => n !== 0, "Amount can't be zero"),
  reason: z.string().min(3, "A reason is required").max(300),
})

export async function POST(req: Request) {
  const { error, payload } = await requireAdmin()
  if (error) return error

  const result = adjustSchema.safeParse(await req.json())
  if (!result.success) {
    return Response.json({ message: "Invalid data", errors: result.error.flatten() }, { status: 400 })
  }
  const { userId, amount, reason } = result.data

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) {
    return Response.json({ message: "User not found" }, { status: 404 })
  }

  try {
    await prisma.$transaction(async (tx) => {
      await applyCreditTransaction(tx, {
        userId,
        amount,
        type: "ADMIN_ADJUSTMENT",
        reason,
        createdById: payload!.id as string,
      })
    })
  } catch (err) {
    if (err instanceof InsufficientCreditsError) {
      return Response.json({ message: `This user only has ${user.creditBalance} credits — can't deduct ${-amount}` }, { status: 409 })
    }
    throw err
  }

  return Response.json({ message: "Adjustment applied" })
}
