import type { PrismaClient } from "@/generated/prisma/client";
import { consumeRateLimit, isRateLimited } from "@/lib/rate-limit";
import { findEvent } from "@/modules/event/repositories/event-repository";
import { INVITATION_TOKEN_PATTERN } from "@/modules/invitation/domain/invitation-rules";
import { findInvitationByToken } from "@/modules/invitation/repositories/guest-invitation-repository";
import {
  INVALID_TOKEN_RATE_LIMIT,
  RSVP_CHANGE_RATE_LIMIT,
  invalidTokenKey,
  isRsvpOpen,
  rsvpChangeKey,
} from "@/modules/rsvp/domain/rsvp-rules";
import {
  RsvpClosedError,
  RsvpInvitationNotFoundError,
  saveRsvp,
} from "@/modules/rsvp/repositories/rsvp-repository";
import type { RsvpAnswer } from "@/modules/rsvp/schemas/rsvp-form";

export type SubmitRsvpResult =
  | { ok: true; answer: RsvpAnswer }
  | { ok: false; reason: "invalid" | "not_found" | "closed" | "rate_limited" };

export async function submitRsvp(
  db: PrismaClient,
  token: string,
  answer: RsvpAnswer | null,
  clientIp: string,
  now: Date = new Date(),
): Promise<SubmitRsvpResult> {
  const ipKey = invalidTokenKey(clientIp);
  if (await isRateLimited(db, ipKey, INVALID_TOKEN_RATE_LIMIT, now))
    return { ok: false, reason: "not_found" };
  if (!INVITATION_TOKEN_PATTERN.test(token)) {
    await consumeRateLimit(db, ipKey, INVALID_TOKEN_RATE_LIMIT, now);
    return { ok: false, reason: "not_found" };
  }
  if (!(await findInvitationByToken(db, token))) {
    await consumeRateLimit(db, ipKey, INVALID_TOKEN_RATE_LIMIT, now);
    return { ok: false, reason: "not_found" };
  }
  if (!answer) return { ok: false, reason: "invalid" };

  const event = await findEvent(db);
  if (!event) return { ok: false, reason: "closed" };

  // Counted per invitation only once the invitation is known to exist, so
  // random tokens cannot fill the rate-limit table.
  const limit = await consumeRateLimit(
    db,
    rsvpChangeKey(token),
    RSVP_CHANGE_RATE_LIMIT,
    now,
  );
  if (!limit.allowed) return { ok: false, reason: "rate_limited" };

  try {
    await saveRsvp(
      db,
      token,
      answer,
      () => isRsvpOpen(event.startsAt, now),
      now,
    );
    return { ok: true, answer };
  } catch (error) {
    if (error instanceof RsvpInvitationNotFoundError) {
      await consumeRateLimit(db, ipKey, INVALID_TOKEN_RATE_LIMIT, now);
      return { ok: false, reason: "not_found" };
    }
    if (error instanceof RsvpClosedError)
      return { ok: false, reason: "closed" };
    throw error;
  }
}
