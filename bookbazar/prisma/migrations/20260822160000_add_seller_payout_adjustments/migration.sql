-- Tracks what BookMandu owes a seller when a buyer's coupon/credit
-- discount reduced the COD cash that seller actually collects at
-- delivery. No payment gateway exists to settle this automatically —
-- this is the ledger, settlement itself stays manual for now.

CREATE TYPE "PayoutAdjustmentStatus" AS ENUM ('PENDING', 'PAID');

CREATE TABLE "seller_payout_adjustments" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "PayoutAdjustmentStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),
    "paidById" TEXT,
    CONSTRAINT "seller_payout_adjustments_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "seller_payout_adjustments_storeId_idx" ON "seller_payout_adjustments"("storeId");
CREATE INDEX "seller_payout_adjustments_status_idx" ON "seller_payout_adjustments"("status");
ALTER TABLE "seller_payout_adjustments" ADD CONSTRAINT "seller_payout_adjustments_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "seller_payout_adjustments" ADD CONSTRAINT "seller_payout_adjustments_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "seller_payout_adjustments" ADD CONSTRAINT "seller_payout_adjustments_paidById_fkey" FOREIGN KEY ("paidById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
