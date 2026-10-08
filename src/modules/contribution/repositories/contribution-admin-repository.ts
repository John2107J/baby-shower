import type {
  ContributionStatus,
  PrismaClient,
} from "@/generated/prisma/client";
import {
  type GiftCommitments,
  maxAmountForEdit,
} from "@/modules/contribution/domain/gift-progress";
import {
  type Transaction,
  lockGift,
} from "@/modules/contribution/repositories/gift-list-repository";

export type AdminContributionRecord = {
  id: string;
  amountCents: number;
  status: ContributionStatus;
  createdAt: Date;
  giftTitle: string;
  giftArchived: boolean;
  guestNames: string[];
};

export type AdminClaimRecord = {
  id: string;
  giftId: string;
  units: number;
  createdAt: Date;
  voidedAt: Date | null;
  giftTitle: string;
  giftArchived: boolean;
  guestNames: string[];
};

const RELATIONS = {
  gift: { select: { title: true, archivedAt: true } },
  invitation: { select: { guestNames: true } },
} as const;

export async function listContributionsForAdmin(
  db: PrismaClient,
): Promise<AdminContributionRecord[]> {
  const rows = await db.contribution.findMany({
    select: {
      id: true,
      amountCents: true,
      status: true,
      createdAt: true,
      ...RELATIONS,
    },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(({ gift, invitation, ...row }) => ({
    ...row,
    giftTitle: gift.title,
    giftArchived: gift.archivedAt !== null,
    guestNames: invitation.guestNames,
  }));
}

export async function listClaimsForAdmin(
  db: PrismaClient,
): Promise<AdminClaimRecord[]> {
  const rows = await db.giftClaim.findMany({
    select: {
      id: true,
      giftId: true,
      units: true,
      createdAt: true,
      voidedAt: true,
      ...RELATIONS,
    },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(({ gift, invitation, ...row }) => ({
    ...row,
    giftTitle: gift.title,
    giftArchived: gift.archivedAt !== null,
    guestNames: invitation.guestNames,
  }));
}

export type AdminChangeOutcome =
  | { status: "saved" | "unchanged" | "not_found" | "voided" }
  | { status: "above_maximum"; maxCents: number };

/**
 * Runs a change on one contribution while holding its gift's lock, the same
 * lock guests take, so a parent's edit and a guest's declaration never
 * interleave. The contribution is read again after locking.
 */
async function withContributionLock(
  db: PrismaClient,
  contributionId: string,
  change: (
    tx: Transaction,
    contribution: {
      giftId: string;
      amountCents: number;
      status: ContributionStatus;
    },
    commitments: GiftCommitments | null,
  ) => Promise<AdminChangeOutcome>,
): Promise<AdminChangeOutcome> {
  return db.$transaction(async (tx) => {
    const target = await tx.contribution.findUnique({
      where: { id: contributionId },
      select: { giftId: true },
    });
    if (!target) return { status: "not_found" };
    const commitments = await lockGift(tx, target.giftId, {
      includeArchived: true,
    });
    const contribution = await tx.contribution.findUniqueOrThrow({
      where: { id: contributionId },
      select: { giftId: true, amountCents: true, status: true },
    });
    return change(tx, contribution, commitments);
  });
}

/** Decision 41: the parents confirm money that arrived. Confirming twice is harmless. */
export function confirmContribution(
  db: PrismaClient,
  contributionId: string,
): Promise<AdminChangeOutcome> {
  return withContributionLock(db, contributionId, async (tx, contribution) => {
    if (contribution.status === "VOIDED") return { status: "voided" };
    if (contribution.status === "CONFIRMED") return { status: "unchanged" };
    await tx.contribution.update({
      where: { id: contributionId },
      data: { status: "CONFIRMED" },
    });
    return { status: "saved" };
  });
}

/** Decision 51: any positive amount up to what the gift still needs. The status is kept. */
export function updateContributionAmount(
  db: PrismaClient,
  contributionId: string,
  amountCents: number,
): Promise<AdminChangeOutcome> {
  return withContributionLock(
    db,
    contributionId,
    async (tx, contribution, commitments) => {
      if (contribution.status === "VOIDED") return { status: "voided" };
      if (contribution.amountCents === amountCents)
        return { status: "unchanged" };
      if (!commitments) return { status: "not_found" };
      const othersOnly = {
        ...commitments,
        confirmedCents:
          commitments.confirmedCents -
          (contribution.status === "CONFIRMED" ? contribution.amountCents : 0),
        pendingCents:
          commitments.pendingCents -
          (contribution.status === "DECLARED" ? contribution.amountCents : 0),
      };
      const maxCents = maxAmountForEdit(othersOnly);
      if (amountCents > maxCents) return { status: "above_maximum", maxCents };
      await tx.contribution.update({
        where: { id: contributionId },
        data: { amountCents },
      });
      return { status: "saved" };
    },
  );
}

/** Decision 45 and owner's answer 2 in phase 5b: voiding is final. Voiding twice is harmless. */
export function voidContribution(
  db: PrismaClient,
  contributionId: string,
): Promise<AdminChangeOutcome> {
  return withContributionLock(db, contributionId, async (tx, contribution) => {
    if (contribution.status === "VOIDED") return { status: "unchanged" };
    await tx.contribution.update({
      where: { id: contributionId },
      data: { status: "VOIDED" },
    });
    return { status: "saved" };
  });
}

/** Decision 45: frees the unit for guests again; the row stays for history. */
export async function voidClaim(
  db: PrismaClient,
  claimId: string,
  now: Date,
): Promise<AdminChangeOutcome> {
  return db.$transaction(async (tx) => {
    const target = await tx.giftClaim.findUnique({
      where: { id: claimId },
      select: { giftId: true },
    });
    if (!target) return { status: "not_found" };
    await lockGift(tx, target.giftId, { includeArchived: true });
    const result = await tx.giftClaim.updateMany({
      where: { id: claimId, voidedAt: null },
      data: { voidedAt: now },
    });
    return { status: result.count === 1 ? "saved" : "unchanged" };
  });
}
