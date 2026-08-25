import "server-only"
import type { Prisma } from "@/lib/generated/prisma/client"

type TxClient = Prisma.TransactionClient

/**
 * Splits a coupon/credit discount across the stores in a (possibly
 * multi-seller) order, proportional to each store's share of the order
 * subtotal, and records what BookMandu owes each of them for it.
 *
 * Why this exists at all: BookMandu has no payment gateway. COD cash is
 * collected directly by the seller from the buyer, so a discount applied
 * at checkout isn't absorbed by BookMandu automatically the way it would
 * be with a real payment processor sitting in the middle — without this,
 * the seller just collects less cash and quietly eats the difference.
 * This ledger is the trace of what's actually owed back to them; settling
 * it (bank transfer, etc.) is still a manual, admin-driven step for now —
 * see /admin/seller-payouts.
 */
export async function allocatePayoutAdjustments(
  tx: TxClient,
  params: {
    orderId: string
    items: { storeId: string; totalPrice: number }[]
    totalDiscount: number
  }
) {
  const rounded = Math.round(params.totalDiscount * 100) / 100
  if (rounded <= 0) return

  const subtotalByStore = new Map<string, number>()
  for (const item of params.items) {
    subtotalByStore.set(item.storeId, (subtotalByStore.get(item.storeId) ?? 0) + item.totalPrice)
  }
  const grandSubtotal = [...subtotalByStore.values()].reduce((sum, v) => sum + v, 0)
  if (grandSubtotal <= 0) return

  const storeIds = [...subtotalByStore.keys()]
  let allocated = 0

  for (let i = 0; i < storeIds.length; i++) {
    const storeId = storeIds[i]
    const storeSubtotal = subtotalByStore.get(storeId)!
    // The last store absorbs whatever rounding remainder is left, so the
    // sum of all shares always equals the discount exactly — never a
    // fraction of a rupee unaccounted for.
    const isLast = i === storeIds.length - 1
    const share = isLast ? Math.round((rounded - allocated) * 100) / 100 : Math.round((storeSubtotal / grandSubtotal) * rounded * 100) / 100
    allocated += share

    if (share > 0) {
      await tx.sellerPayoutAdjustment.create({
        data: {
          storeId,
          orderId: params.orderId,
          amount: share,
          reason: "Coupon/credit discount applied by buyer at checkout",
        },
      })
    }
  }
}
