import type {
  ContributionStatus,
  PrismaClient,
} from "@/generated/prisma/client";
import { Prisma } from "@/generated/prisma/client";
import {
  type ContributionCheck,
  type GiftCommitments,
  checkContributionAmount,
  computeGiftProgress,
} from "@/modules/contribution/domain/gift-progress";
import {
  MIN_INTERVAL_BETWEEN_CONTRIBUTIONS_MS,
  UNITS_PER_CLAIM,
} from "@/modules/contribution/domain/gift-list-rules";

export type Transaction = Parameters<
  Parameters<PrismaClient["$transaction"]>[0]
>[0];
type Db = PrismaClient | Transaction;

export type PublicGiftRecord = {
  id: string;
  title: string;
  imageUrl: string;
  productUrl: string;
  unitPriceCents: number;
  quantity: number;
  sortOrder: number;
  commitments: GiftCommitments;
};

export type OwnCommitmentRecord =
  | { kind: "claim"; giftTitle: string; units: number; createdAt: Date }
  | {
      kind: "contribution";
      giftTitle: string;
      amountCents: number;
      status: Exclude<ContributionStatus, "VOIDED">;
      createdAt: Date;
    };

/** Sums of active claims and contributions per gift. Who made them is never selected. */
async function commitmentsByGift(db: Db, giftIds: string[]) {
  const [claims, contributions] = await Promise.all([
    db.giftClaim.groupBy({
      by: ["giftId"],
      where: { giftId: { in: giftIds }, voidedAt: null },
      _sum: { units: true },
    }),
    db.contribution.groupBy({
      by: ["giftId", "status"],
      where: { giftId: { in: giftIds }, status: { not: "VOIDED" } },
      _sum: { amountCents: true },
    }),
  ]);
  const totals = new Map(
    giftIds.map((id) => [
      id,
      { claimedUnits: 0, confirmedCents: 0, pendingCents: 0 },
    ]),
  );
  for (const row of claims)
    totals.get(row.giftId)!.claimedUnits = row._sum.units ?? 0;
  for (const row of contributions) {
    const total = totals.get(row.giftId)!;
    const amount = row._sum.amountCents ?? 0;
    if (row.status === "CONFIRMED") total.confirmedCents += amount;
    else total.pendingCents += amount;
  }
  return totals;
}

/** Gifts visible to guests: archived ones are hidden (decision 22). */
export async function listPublicGifts(
  db: PrismaClient,
): Promise<PublicGiftRecord[]> {
  const gifts = await db.gift.findMany({
    where: { archivedAt: null },
    select: {
      id: true,
      title: true,
      imageUrl: true,
      productUrl: true,
      referencePriceCents: true,
      quantity: true,
      sortOrder: true,
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  const totals = await commitmentsByGift(
    db,
    gifts.map((gift) => gift.id),
  );
  return gifts.map(({ referencePriceCents, ...gift }) => ({
    ...gift,
    unitPriceCents: referencePriceCents,
    commitments: {
      quantity: gift.quantity,
      unitPriceCents: referencePriceCents,
      ...totals.get(gift.id)!,
    },
  }));
}

/** What this invitation chose, and nothing about anybody else (CLAUDE.md §3.5). */
export async function listOwnCommitments(
  db: PrismaClient,
  invitationId: string,
): Promise<OwnCommitmentRecord[]> {
  const [claims, contributions] = await Promise.all([
    db.giftClaim.findMany({
      where: { invitationId, voidedAt: null },
      select: {
        units: true,
        createdAt: true,
        gift: { select: { title: true } },
      },
    }),
    db.contribution.findMany({
      where: { invitationId, status: { not: "VOIDED" } },
      select: {
        amountCents: true,
        status: true,
        createdAt: true,
        gift: { select: { title: true } },
      },
    }),
  ]);
  const records: OwnCommitmentRecord[] = [
    ...claims.map((claim) => ({
      kind: "claim" as const,
      giftTitle: claim.gift.title,
      units: claim.units,
      createdAt: claim.createdAt,
    })),
    ...contributions.map((contribution) => ({
      kind: "contribution" as const,
      giftTitle: contribution.gift.title,
      amountCents: contribution.amountCents,
      // VOIDED rows are filtered out by the query.
      status: contribution.status as Exclude<ContributionStatus, "VOIDED">,
      createdAt: contribution.createdAt,
    })),
  ];
  return records.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
}

export type GuestRequest = {
  invitationId: string;
  giftId: string;
  idempotencyKey: string;
};

/** "duplicate": this exact request was already saved (double click or retry). */
export type ExistingRequest = "none" | "duplicate" | "conflict";

export async function findExistingRequest(
  db: Db,
  kind: "claim" | "contribution",
  request: GuestRequest,
): Promise<ExistingRequest> {
  const where = { idempotencyKey: request.idempotencyKey };
  const select = { invitationId: true, giftId: true } as const;
  const row =
    kind === "claim"
      ? await db.giftClaim.findUnique({ where, select })
      : await db.contribution.findUnique({ where, select });
  if (!row) return "none";
  return row.invitationId === request.invitationId &&
    row.giftId === request.giftId
    ? "duplicate"
    : "conflict";
}

/**
 * Locks the gift's row until the transaction ends, so concurrent claims and
 * contributions on the same gift run one after the other and each one sees
 * what the previous ones saved (CLAUDE.md §3.6). Archived gifts count as
 * missing for guests; the parents still manage their history.
 */
export async function lockGift(
  tx: Transaction,
  giftId: string,
  { includeArchived = false }: { includeArchived?: boolean } = {},
): Promise<GiftCommitments | null> {
  const rows = await tx.$queryRaw<
    { quantity: number; referencePriceCents: number }[]
  >`SELECT "quantity", "referencePriceCents" FROM "Gift"
    WHERE "id" = ${giftId}::uuid AND (${includeArchived} OR "archivedAt" IS NULL)
    FOR UPDATE`;
  const gift = rows[0];
  if (!gift) return null;
  const totals = (await commitmentsByGift(tx, [giftId])).get(giftId)!;
  return {
    quantity: gift.quantity,
    unitPriceCents: gift.referencePriceCents,
    ...totals,
  };
}

/**
 * Locks the invitation's row so two contributions from the same guest (two
 * tabs, two gifts) cannot both pass the 3-minute check. Always taken before
 * the gift's lock, so the lock order is the same everywhere.
 */
async function lockInvitation(tx: Transaction, invitationId: string) {
  await tx.$queryRaw`SELECT "id" FROM "Invitation" WHERE "id" = ${invitationId}::uuid FOR UPDATE`;
}

async function contributedRecently(
  tx: Transaction,
  invitationId: string,
  now: Date,
): Promise<boolean> {
  const recent = await tx.contribution.findFirst({
    where: {
      invitationId,
      createdAt: {
        gt: new Date(now.getTime() - MIN_INTERVAL_BETWEEN_CONTRIBUTIONS_MS),
      },
    },
    select: { id: true },
  });
  return recent !== null;
}

export type ClaimOutcome =
  | "saved"
  | "duplicate"
  | "conflict"
  | "gift_not_found"
  | "closed"
  | "not_available";

export type ContributionOutcome =
  | {
      status:
        | "saved"
        | "duplicate"
        | "conflict"
        | "gift_not_found"
        | "closed"
        | "too_soon";
    }
  | { status: "rejected"; check: Exclude<ContributionCheck, { ok: true }> };

const isUniqueViolation = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError &&
  error.code === "P2002";

/**
 * Runs `save` inside a transaction holding the gift lock. A unique violation
 * on the idempotency key means a concurrent copy of the same request won;
 * it is resolved by looking the key up again.
 */
async function withGiftLock<T>(
  db: PrismaClient,
  kind: "claim" | "contribution",
  request: GuestRequest,
  save: (tx: Transaction) => Promise<T>,
  fromExisting: (existing: Exclude<ExistingRequest, "none">) => T,
): Promise<T> {
  try {
    return await db.$transaction(save);
  } catch (error) {
    if (!isUniqueViolation(error)) throw error;
    const existing = await findExistingRequest(db, kind, request);
    if (existing === "none") throw error;
    return fromExisting(existing);
  }
}

export function claimGiftUnit(
  db: PrismaClient,
  request: GuestRequest,
  isOpen: () => boolean,
  now: Date,
): Promise<ClaimOutcome> {
  return withGiftLock(
    db,
    "claim",
    request,
    async (tx) => {
      const commitments = await lockGift(tx, request.giftId);
      if (!commitments) return "gift_not_found";
      const existing = await findExistingRequest(tx, "claim", request);
      if (existing !== "none") return existing;
      if (!isOpen()) return "closed";
      const progress = computeGiftProgress(commitments);
      if (progress.state === "complete" || !progress.canClaim)
        return "not_available";
      await tx.giftClaim.create({
        data: { ...request, units: UNITS_PER_CLAIM, createdAt: now },
      });
      return "saved";
    },
    (existing) => existing,
  );
}

export function declareContribution(
  db: PrismaClient,
  request: GuestRequest & { amountCents: number },
  isOpen: () => boolean,
  now: Date,
): Promise<ContributionOutcome> {
  return withGiftLock<ContributionOutcome>(
    db,
    "contribution",
    request,
    async (tx) => {
      await lockInvitation(tx, request.invitationId);
      const commitments = await lockGift(tx, request.giftId);
      if (!commitments) return { status: "gift_not_found" };
      const existing = await findExistingRequest(tx, "contribution", request);
      if (existing !== "none") return { status: existing };
      if (!isOpen()) return { status: "closed" };
      const check = checkContributionAmount(
        request.amountCents,
        computeGiftProgress(commitments),
      );
      if (!check.ok) return { status: "rejected", check };
      if (await contributedRecently(tx, request.invitationId, now))
        return { status: "too_soon" };
      await tx.contribution.create({ data: { ...request, createdAt: now } });
      return { status: "saved" };
    },
    (existing) => ({ status: existing }),
  );
}
