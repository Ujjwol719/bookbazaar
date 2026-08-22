import "server-only"
import type { Prisma, CreditTransactionType } from "@/lib/generated/prisma/client"
import prisma from "@/lib/prisma"

export class InsufficientCreditsError extends Error {
  constructor(message = "Insufficient credit balance") {
    super(message)
    this.name = "InsufficientCreditsError"
  }
}

type TxClient = Prisma.TransactionClient

/**
 * The one place a User.creditBalance is ever written. CreditTransaction is
 * the source of truth — this always writes both the ledger row and the
 * balance cache together, inside the caller's transaction.
 *
 * amount is signed: positive credits the user (reward/refund), negative
 * debits them (redemption, or a negative admin adjustment). A debit is a
 * single conditional UPDATE (`creditBalance >= -amount`) so two concurrent
 * redemptions can't both succeed past a balance neither of them actually
 * had — no separate "read balance, then write" round trip to race against.
 */
export async function applyCreditTransaction(
  tx: TxClient,
  params: {
    userId: string
    amount: number
    type: CreditTransactionType
    reason: string
    referenceType?: string
    referenceId?: string
    createdById?: string
  }
) {
  if (!Number.isInteger(params.amount) || params.amount === 0) {
    throw new Error("Credit amount must be a non-zero integer")
  }

  if (params.amount < 0) {
    const result = await tx.user.updateMany({
      where: { id: params.userId, creditBalance: { gte: -params.amount } },
      data: { creditBalance: { increment: params.amount } },
    })
    if (result.count === 0) {
      throw new InsufficientCreditsError()
    }
  } else {
    await tx.user.update({
      where: { id: params.userId },
      data: { creditBalance: { increment: params.amount } },
    })
  }

  await tx.creditTransaction.create({
    data: {
      userId: params.userId,
      amount: params.amount,
      type: params.type,
      reason: params.reason,
      referenceType: params.referenceType,
      referenceId: params.referenceId,
      createdById: params.createdById,
    },
  })
}

// Single-row config table — creates the row with defaults on first read if
// it's somehow missing, so nothing downstream has to null-check it.
export async function getCreditSettings(client: TxClient | typeof prisma = prisma) {
  const existing = await client.creditSettings.findFirst()
  if (existing) return existing
  return client.creditSettings.create({ data: {} })
}
