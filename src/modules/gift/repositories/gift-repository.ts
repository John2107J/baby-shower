import type { PrismaClient } from "@/generated/prisma/client";

export type GiftData = {
  title: string;
  imageUrl: string;
  productUrl: string;
  referencePriceCents: number;
  quantity: number;
};

export type AdminGiftRecord = GiftData & {
  id: string;
  sortOrder: number;
  archivedAt: Date | null;
  claimedUnits: number;
  activeContributionsCount: number;
};

type Transaction = Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0];

export class GiftNotFoundError extends Error {
  constructor() {
    super("Gift not found");
    this.name = "GiftNotFoundError";
  }
}

export class QuantityBelowClaimedError extends Error {
  constructor(public readonly claimedUnits: number) {
    super("Quantity below claimed units");
    this.name = "QuantityBelowClaimedError";
  }
}

const GIFT_SELECT = {
  id: true,
  title: true,
  imageUrl: true,
  productUrl: true,
  referencePriceCents: true,
  quantity: true,
  sortOrder: true,
  archivedAt: true,
} as const;

async function claimedUnitsByGift(
  db: PrismaClient | Transaction,
  giftIds: string[],
) {
  const rows = await db.giftClaim.groupBy({
    by: ["giftId"],
    where: { giftId: { in: giftIds }, voidedAt: null },
    _sum: { units: true },
  });
  return new Map(rows.map((row) => [row.giftId, row._sum.units ?? 0]));
}

async function activeContributionsByGift(
  db: PrismaClient | Transaction,
  giftIds: string[],
) {
  const rows = await db.contribution.groupBy({
    by: ["giftId"],
    where: { giftId: { in: giftIds }, status: { not: "VOIDED" } },
    _count: { _all: true },
  });
  return new Map(rows.map((row) => [row.giftId, row._count._all]));
}

export async function listGiftsForAdmin(
  db: PrismaClient,
): Promise<AdminGiftRecord[]> {
  const gifts = await db.gift.findMany({
    select: GIFT_SELECT,
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  const ids = gifts.map((gift) => gift.id);
  const [claimed, contributions] = await Promise.all([
    claimedUnitsByGift(db, ids),
    activeContributionsByGift(db, ids),
  ]);
  return gifts.map((gift) => ({
    ...gift,
    claimedUnits: claimed.get(gift.id) ?? 0,
    activeContributionsCount: contributions.get(gift.id) ?? 0,
  }));
}

export async function findGiftForAdmin(
  db: PrismaClient,
  id: string,
): Promise<AdminGiftRecord | null> {
  const gift = await db.gift.findUnique({ where: { id }, select: GIFT_SELECT });
  if (!gift) return null;
  const [claimed, contributions] = await Promise.all([
    claimedUnitsByGift(db, [id]),
    activeContributionsByGift(db, [id]),
  ]);
  return {
    ...gift,
    claimedUnits: claimed.get(id) ?? 0,
    activeContributionsCount: contributions.get(id) ?? 0,
  };
}

export async function createGift(
  db: PrismaClient,
  data: GiftData,
): Promise<string> {
  return db.$transaction(async (tx) => {
    const last = await tx.gift.aggregate({ _max: { sortOrder: true } });
    const gift = await tx.gift.create({
      data: { ...data, sortOrder: (last._max.sortOrder ?? -1) + 1 },
      select: { id: true },
    });
    return gift.id;
  });
}

/**
 * Updates a gift while holding a row lock, so a concurrent reservation cannot
 * slip in between the "claimed units" check and the quantity change.
 * Returns the previous image URL.
 */
export async function updateGift(
  db: PrismaClient,
  id: string,
  data: Omit<GiftData, "imageUrl"> & { imageUrl?: string },
): Promise<{ previousImageUrl: string }> {
  return db.$transaction(async (tx) => {
    const locked = await tx.$queryRaw<{ imageUrl: string }[]>`
      SELECT "imageUrl" FROM "Gift" WHERE "id" = ${id}::uuid FOR UPDATE`;
    const current = locked[0];
    if (!current) throw new GiftNotFoundError();

    const claimedUnits = (await claimedUnitsByGift(tx, [id])).get(id) ?? 0;
    if (data.quantity < claimedUnits)
      throw new QuantityBelowClaimedError(claimedUnits);

    await tx.gift.update({ where: { id }, data });
    return { previousImageUrl: current.imageUrl };
  });
}

export async function setGiftArchived(
  db: PrismaClient,
  id: string,
  archived: boolean,
): Promise<boolean> {
  const result = await db.gift.updateMany({
    where: { id },
    data: { archivedAt: archived ? new Date() : null },
  });
  return result.count === 1;
}

/** Swaps a gift with its neighbour and renumbers all gifts 0..n-1 to remove ties. */
export async function moveGift(
  db: PrismaClient,
  id: string,
  direction: "up" | "down",
): Promise<boolean> {
  return db.$transaction(async (tx) => {
    // Lock the whole ordering so concurrent moves do not interleave.
    await tx.$queryRaw`SELECT 1 FROM "Gift" FOR UPDATE`;
    const ordered = await tx.gift.findMany({
      select: { id: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
    const index = ordered.findIndex((gift) => gift.id === id);
    if (index === -1) return false;
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= ordered.length) return true;

    const reordered = [...ordered];
    [reordered[index], reordered[target]] = [
      reordered[target]!,
      reordered[index]!,
    ];
    for (const [position, gift] of reordered.entries()) {
      await tx.gift.update({
        where: { id: gift.id },
        data: { sortOrder: position },
      });
    }
    return true;
  });
}
