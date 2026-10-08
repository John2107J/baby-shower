import type { RateLimitRule } from "@/lib/rate-limit";

/** Decision 40: each "Yo lo llevo" covers exactly one whole unit. */
export const UNITS_PER_CLAIM = 1;

/**
 * Owner's answer 6 in phase 5: guests may contribute as often as they like,
 * but at least 3 minutes apart (counted between saved contributions, so a
 * mistyped amount does not lock anyone out).
 */
export const MIN_INTERVAL_BETWEEN_CONTRIBUTIONS_MS = 3 * 60 * 1000;

/** Proposed in the phase 5 plan: 20 attempts ("Yo lo llevo" or contributions) per invitation every 10 minutes. */
export const GIFT_ACTION_RATE_LIMIT: RateLimitRule = {
  limit: 20,
  windowMs: 10 * 60 * 1000,
};

export const giftActionRateKey = (invitationId: string) =>
  `gift-list:invitation:${invitationId}`;

/** Owner's answer 4 in phase 5: the gift list closes when the event starts, like the RSVP. */
export function isGiftListOpen(
  eventStartsAt: Date,
  now: Date = new Date(),
): boolean {
  return now.getTime() < eventStartsAt.getTime();
}
