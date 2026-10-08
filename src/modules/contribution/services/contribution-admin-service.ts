import type { PrismaClient } from "@/generated/prisma/client";
import {
  type AdminClaimGroup,
  type AdminContributionItem,
  type AdminContributionSummary,
  groupClaimsByGift,
  summarizeContributions,
  toAdminContributionItems,
} from "@/modules/contribution/dto/contribution-admin-dto";
import {
  type AdminChangeOutcome,
  confirmContribution,
  listClaimsForAdmin,
  listContributionsForAdmin,
  updateContributionAmount,
  voidClaim,
  voidContribution,
} from "@/modules/contribution/repositories/contribution-admin-repository";
import { isValidId } from "@/modules/contribution/schemas/contribution-admin-form";

export async function getContributionsOverview(db: PrismaClient): Promise<{
  summary: AdminContributionSummary;
  contributions: AdminContributionItem[];
  claimGroups: AdminClaimGroup[];
}> {
  const [contributions, claims] = await Promise.all([
    listContributionsForAdmin(db),
    listClaimsForAdmin(db),
  ]);
  return {
    summary: summarizeContributions(contributions),
    contributions: toAdminContributionItems(contributions),
    claimGroups: groupClaimsByGift(claims),
  };
}

export type AdminChangeResult = AdminChangeOutcome | { status: "invalid" };

const NOT_FOUND: AdminChangeResult = { status: "not_found" };

export const confirmContributionById = (db: PrismaClient, id: string) =>
  isValidId(id) ? confirmContribution(db, id) : Promise.resolve(NOT_FOUND);

export const voidContributionById = (db: PrismaClient, id: string) =>
  isValidId(id) ? voidContribution(db, id) : Promise.resolve(NOT_FOUND);

export const voidClaimById = (
  db: PrismaClient,
  id: string,
  now: Date = new Date(),
) => (isValidId(id) ? voidClaim(db, id, now) : Promise.resolve(NOT_FOUND));

export async function editContributionAmount(
  db: PrismaClient,
  id: string,
  amountCents: number | null,
): Promise<AdminChangeResult> {
  if (!isValidId(id)) return NOT_FOUND;
  if (amountCents === null) return { status: "invalid" };
  return updateContributionAmount(db, id, amountCents);
}
