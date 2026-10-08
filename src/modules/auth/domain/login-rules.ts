import type { RateLimitRule } from "@/lib/rate-limit";

const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;
const EIGHT_HOURS_IN_SECONDS = 8 * 60 * 60;

/** Approved by the owner: 5 failed attempts per 15 minutes, per IP (decision 13, updated in phase 7c). */
export const LOGIN_RATE_LIMIT: RateLimitRule = {
  limit: 5,
  windowMs: FIFTEEN_MINUTES_MS,
};

/** Approved by the owner: admin sessions last 8 hours. */
export const ADMIN_SESSION_MAX_AGE_SECONDS = EIGHT_HOURS_IN_SECONDS;

export const loginRateLimitKey = (clientIp: string) => `login:ip:${clientIp}`;
