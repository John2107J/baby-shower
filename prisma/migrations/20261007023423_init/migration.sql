-- CreateEnum
CREATE TYPE "RsvpStatus" AS ENUM ('PENDING', 'ATTENDING', 'NOT_ATTENDING');

-- CreateEnum
CREATE TYPE "SentVia" AS ENUM ('WHATSAPP', 'EMAIL');

-- CreateEnum
CREATE TYPE "ContributionStatus" AS ENUM ('DECLARED', 'CONFIRMED', 'VOIDED');

-- CreateTable
CREATE TABLE "Event" (
    "id" UUID NOT NULL,
    "babyName" TEXT NOT NULL,
    "startsAt" TIMESTAMPTZ(3) NOT NULL,
    "venueName" TEXT,
    "streetAddress" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "mapsUrl" TEXT,
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "paymentAlias" TEXT,
    "paymentCbu" TEXT,
    "paymentHolderName" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invitation" (
    "id" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "guestNames" TEXT[],
    "rsvpStatus" "RsvpStatus" NOT NULL DEFAULT 'PENDING',
    "rsvpAttendeesCount" INTEGER,
    "rsvpUpdatedAt" TIMESTAMPTZ(3),
    "sentVia" "SentVia",
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Gift" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "productUrl" TEXT NOT NULL,
    "referencePriceCents" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "archivedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Gift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GiftClaim" (
    "id" UUID NOT NULL,
    "giftId" UUID NOT NULL,
    "invitationId" UUID NOT NULL,
    "units" INTEGER NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GiftClaim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contribution" (
    "id" UUID NOT NULL,
    "giftId" UUID NOT NULL,
    "invitationId" UUID NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "status" "ContributionStatus" NOT NULL DEFAULT 'DECLARED',
    "idempotencyKey" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Contribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateLimitBucket" (
    "key" TEXT NOT NULL,
    "windowStart" TIMESTAMPTZ(3) NOT NULL,
    "count" INTEGER NOT NULL,

    CONSTRAINT "RateLimitBucket_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_token_key" ON "Invitation"("token");

-- CreateIndex
CREATE INDEX "Gift_archivedAt_sortOrder_idx" ON "Gift"("archivedAt", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "GiftClaim_idempotencyKey_key" ON "GiftClaim"("idempotencyKey");

-- CreateIndex
CREATE INDEX "GiftClaim_giftId_idx" ON "GiftClaim"("giftId");

-- CreateIndex
CREATE INDEX "GiftClaim_invitationId_idx" ON "GiftClaim"("invitationId");

-- CreateIndex
CREATE UNIQUE INDEX "Contribution_idempotencyKey_key" ON "Contribution"("idempotencyKey");

-- CreateIndex
CREATE INDEX "Contribution_giftId_idx" ON "Contribution"("giftId");

-- CreateIndex
CREATE INDEX "Contribution_invitationId_idx" ON "Contribution"("invitationId");

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");

-- AddForeignKey
ALTER TABLE "GiftClaim" ADD CONSTRAINT "GiftClaim_giftId_fkey" FOREIGN KEY ("giftId") REFERENCES "Gift"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GiftClaim" ADD CONSTRAINT "GiftClaim_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "Invitation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contribution" ADD CONSTRAINT "Contribution_giftId_fkey" FOREIGN KEY ("giftId") REFERENCES "Gift"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contribution" ADD CONSTRAINT "Contribution_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "Invitation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Business rules enforced by the database as a last line of defense
-- (the application validates them first with Zod).
ALTER TABLE "Event" ADD CONSTRAINT "Event_payment_method_required"
  CHECK ("paymentAlias" IS NOT NULL OR "paymentCbu" IS NOT NULL);

ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_guestNames_count"
  CHECK (cardinality("guestNames") BETWEEN 1 AND 5);
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_rsvpAttendeesCount_range"
  CHECK ("rsvpAttendeesCount" IS NULL OR "rsvpAttendeesCount" BETWEEN 0 AND cardinality("guestNames"));

ALTER TABLE "Gift" ADD CONSTRAINT "Gift_quantity_positive" CHECK ("quantity" >= 1);
ALTER TABLE "Gift" ADD CONSTRAINT "Gift_referencePriceCents_positive" CHECK ("referencePriceCents" > 0);

ALTER TABLE "GiftClaim" ADD CONSTRAINT "GiftClaim_units_positive" CHECK ("units" >= 1);

ALTER TABLE "Contribution" ADD CONSTRAINT "Contribution_amountCents_positive" CHECK ("amountCents" > 0);

ALTER TABLE "RateLimitBucket" ADD CONSTRAINT "RateLimitBucket_count_non_negative" CHECK ("count" >= 0);
