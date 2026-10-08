import type { PrismaClient } from "@/generated/prisma/client";
import { consumeRateLimit, isRateLimited } from "@/lib/rate-limit";
import { findEvent } from "@/modules/event/repositories/event-repository";
import { INVITATION_TOKEN_PATTERN } from "@/modules/invitation/domain/invitation-rules";
import {
  type GuestInvitationView,
  toGuestInvitationView,
} from "@/modules/invitation/dto/guest-invitation-dto";
import { findInvitationByToken } from "@/modules/invitation/repositories/guest-invitation-repository";
import {
  INVALID_TOKEN_RATE_LIMIT,
  invalidTokenKey,
} from "@/modules/rsvp/domain/rsvp-rules";

export type GuestInvitationResult =
  | { status: "found"; invitation: GuestInvitationView }
  | { status: "event_not_ready" }
  | { status: "not_found" };

/**
 * Looks up an invitation by its link. Unknown links, malformed links and
 * blocked IPs all return the same "not_found", so links cannot be enumerated.
 */
export async function getGuestInvitation(
  db: PrismaClient,
  token: string,
  clientIp: string,
  now: Date = new Date(),
): Promise<GuestInvitationResult> {
  const ipKey = invalidTokenKey(clientIp);
  if (await isRateLimited(db, ipKey, INVALID_TOKEN_RATE_LIMIT, now))
    return { status: "not_found" };

  const invitation = INVITATION_TOKEN_PATTERN.test(token)
    ? await findInvitationByToken(db, token)
    : null;
  if (!invitation) {
    await consumeRateLimit(db, ipKey, INVALID_TOKEN_RATE_LIMIT, now);
    return { status: "not_found" };
  }

  const event = await findEvent(db);
  if (!event) return { status: "event_not_ready" };
  return {
    status: "found",
    invitation: toGuestInvitationView(invitation, event, now),
  };
}
