-- Phase 7 security review: changing the password closes every open session.
-- AlterTable
ALTER TABLE "AdminUser" ADD COLUMN     "sessionVersion" INTEGER NOT NULL DEFAULT 0;
