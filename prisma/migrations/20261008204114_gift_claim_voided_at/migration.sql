-- Decision 45: only the parents can cancel a "Yo lo llevo"; the row is kept for history.
-- AlterTable
ALTER TABLE "GiftClaim" ADD COLUMN     "voidedAt" TIMESTAMPTZ(3);
