import type { PrismaClient } from "@/generated/prisma/client";
import { consumeRateLimit, isRateLimited } from "@/lib/rate-limit";
import { INVITATION_TOKEN_PATTERN } from "@/modules/invitation/domain/invitation-rules";
import { findInvitationIdByToken } from "@/modules/invitation/repositories/guest-invitation-repository";
import {
  INVALID_TOKEN_RATE_LIMIT,
  invalidTokenKey,
} from "@/modules/rsvp/domain/rsvp-rules";

/**
 * Resolves a guest link to its invitation id, applying the same rules as the
 * invitation page (decision 30): blocked IPs, malformed links and unknown
 * links all return null, and every failed lookup counts against the IP.
 */
export async function resolveGuestInvitationId(
  db: PrismaClient,
  token: string,
  clientIp: string,
  now: Date = new Date(),
): Promise<string | null> {
  const ipKey = invalidTokenKey(clientIp);
  if (await isRateLimited(db, ipKey, INVALID_TOKEN_RATE_LIMIT, now))
    return null;

  const invitationId = INVITATION_TOKEN_PATTERN.test(token)
    ? await findInvitationIdByToken(db, token)
    : null;
  if (!invitationId)
    await consumeRateLimit(db, ipKey, INVALID_TOKEN_RATE_LIMIT, now);
  return invitationId;
}
