import {
  EVENT_TIME_ZONE,
  utcToZonedDateTime,
  zonedDateTimeToUtc,
} from "@/lib/time-zone";
import type { RateLimitRule } from "@/lib/rate-limit";

/** Decision 28: guests choose how many attend, up to 6 per invitation. */
export const MIN_ATTENDEES = 1;
export const MAX_ATTENDEES = 6;

const TEN_MINUTES_MS = 10 * 60 * 1000;

/** Decision 30: 20 invalid links per IP in 10 minutes blocks that IP for 10 minutes. */
export const INVALID_TOKEN_RATE_LIMIT: RateLimitRule = {
  limit: 20,
  windowMs: TEN_MINUTES_MS,
};
/** Decision 30: each invitation can change its answer up to 10 times every 10 minutes. */
export const RSVP_CHANGE_RATE_LIMIT: RateLimitRule = {
  limit: 10,
  windowMs: TEN_MINUTES_MS,
};

export const invalidTokenKey = (clientIp: string) =>
  `invitation-lookup:ip:${clientIp}`;
export const rsvpChangeKey = (token: string) => `rsvp:token:${token}`;

/**
 * Decision 29: answers can be given or changed until 23:59 of the day before
 * the event (Argentina time); after that the RSVP closes for everyone.
 * Returns the first instant at which the RSVP is closed.
 */
export function rsvpClosesAt(eventStartsAt: Date): Date {
  const { date } = utcToZonedDateTime(eventStartsAt, EVENT_TIME_ZONE);
  return zonedDateTimeToUtc(date, "00:00", EVENT_TIME_ZONE);
}

export function isRsvpOpen(
  eventStartsAt: Date,
  now: Date = new Date(),
): boolean {
  return now.getTime() < rsvpClosesAt(eventStartsAt).getTime();
}
