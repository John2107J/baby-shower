import type { PrismaClient } from "@/generated/prisma/client";
import { consumeRateLimit } from "@/lib/rate-limit";
import {
  GIFT_ACTION_RATE_LIMIT,
  giftActionRateKey,
  isGiftListOpen,
} from "@/modules/contribution/domain/gift-list-rules";
import {
  type GuestGiftListView,
  toGuestGiftListView,
} from "@/modules/contribution/dto/guest-gift-dto";
import {
  type GuestRequest,
  claimGiftUnit,
  declareContribution,
  findExistingRequest,
  listOwnCommitments,
  listPublicGifts,
} from "@/modules/contribution/repositories/gift-list-repository";
import type {
  ClaimInput,
  ContributionInput,
} from "@/modules/contribution/schemas/gift-list-forms";
import { findEvent } from "@/modules/event/repositories/event-repository";
import { resolveGuestInvitationId } from "@/modules/invitation/services/guest-access-service";

export type GuestGiftListResult =
  | { status: "found"; list: GuestGiftListView }
  | { status: "event_not_ready" }
  | { status: "not_found" };

export async function getGuestGiftList(
  db: PrismaClient,
  token: string,
  clientIp: string,
  now: Date = new Date(),
): Promise<GuestGiftListResult> {
  const invitationId = await resolveGuestInvitationId(db, token, clientIp, now);
  if (!invitationId) return { status: "not_found" };
  const event = await findEvent(db);
  if (!event) return { status: "event_not_ready" };
  const [gifts, own] = await Promise.all([
    listPublicGifts(db),
    listOwnCommitments(db, invitationId),
  ]);
  return {
    status: "found",
    list: toGuestGiftListView(
      event,
      isGiftListOpen(event.startsAt, now),
      gifts,
      own,
    ),
  };
}

type CommonFailure =
  "not_found" | "invalid" | "closed" | "rate_limited" | "gift_not_found";

export type ClaimResult =
  { ok: true } | { ok: false; reason: CommonFailure | "not_available" };

export type ContributionResult =
  | { ok: true }
  | {
      ok: false;
      reason:
        | CommonFailure
        | "below_minimum"
        | "above_maximum"
        | "nothing_left"
        | "too_soon";
    };

type Prepared =
  | { ok: true; request: GuestRequest; isOpen: () => boolean }
  | { ok: true; duplicate: true }
  | { ok: false; reason: CommonFailure };

/**
 * Checks shared by claims and contributions, in this order: the link, the
 * input, the deadline, a repeated request (answered as success without
 * counting against the limit), and finally the per-invitation attempts limit.
 */
async function prepareGuestRequest(
  db: PrismaClient,
  kind: "claim" | "contribution",
  token: string,
  input: ClaimInput | null,
  clientIp: string,
  now: Date,
): Promise<Prepared> {
  const invitationId = await resolveGuestInvitationId(db, token, clientIp, now);
  if (!invitationId) return { ok: false, reason: "not_found" };
  if (!input) return { ok: false, reason: "invalid" };
  const event = await findEvent(db);
  const isOpen = () => event !== null && isGiftListOpen(event.startsAt, now);
  if (!isOpen()) return { ok: false, reason: "closed" };

  const request = {
    invitationId,
    giftId: input.giftId,
    idempotencyKey: input.idempotencyKey,
  };
  const existing = await findExistingRequest(db, kind, request);
  if (existing === "duplicate") return { ok: true, duplicate: true };
  if (existing === "conflict") return { ok: false, reason: "invalid" };

  const limit = await consumeRateLimit(
    db,
    giftActionRateKey(invitationId),
    GIFT_ACTION_RATE_LIMIT,
    now,
  );
  if (!limit.allowed) return { ok: false, reason: "rate_limited" };
  return { ok: true, request, isOpen };
}

/** "Yo lo llevo": reserves one whole unit, without confirmation (decisions 40 and 44). */
export async function claimGiftForGuest(
  db: PrismaClient,
  token: string,
  input: ClaimInput | null,
  clientIp: string,
  now: Date = new Date(),
): Promise<ClaimResult> {
  const prepared = await prepareGuestRequest(
    db,
    "claim",
    token,
    input,
    clientIp,
    now,
  );
  if (!prepared.ok) return prepared;
  if ("duplicate" in prepared) return { ok: true };

  const outcome = await claimGiftUnit(
    db,
    prepared.request,
    prepared.isOpen,
    now,
  );
  if (outcome === "saved" || outcome === "duplicate") return { ok: true };
  return {
    ok: false,
    reason: outcome === "conflict" ? "invalid" : outcome,
  };
}

/** Declared contribution, pending until the parents confirm it (decisions 41 and 42). */
export async function declareContributionForGuest(
  db: PrismaClient,
  token: string,
  input: ContributionInput | null,
  clientIp: string,
  now: Date = new Date(),
): Promise<ContributionResult> {
  const prepared = await prepareGuestRequest(
    db,
    "contribution",
    token,
    input,
    clientIp,
    now,
  );
  if (!prepared.ok) return prepared;
  if ("duplicate" in prepared || !input) return { ok: true };

  const outcome = await declareContribution(
    db,
    { ...prepared.request, amountCents: input.amountCents },
    prepared.isOpen,
    now,
  );
  switch (outcome.status) {
    case "saved":
    case "duplicate":
      return { ok: true };
    case "conflict":
      return { ok: false, reason: "invalid" };
    case "rejected":
      return { ok: false, reason: outcome.check.reason };
    default:
      return { ok: false, reason: outcome.status };
  }
}
