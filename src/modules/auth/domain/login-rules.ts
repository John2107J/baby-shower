import type { RateLimitRule } from "@/lib/rate-limit";

const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;
const EIGHT_HOURS_IN_SECONDS = 8 * 60 * 60;

/** Approved by the owner: 5 failed attempts per 15 minutes, per IP and per email. */
export const LOGIN_RATE_LIMIT: RateLimitRule = {
  limit: 5,
  windowMs: FIFTEEN_MINUTES_MS,
};

/** Approved by the owner: admin sessions last 8 hours. */
export const ADMIN_SESSION_MAX_AGE_SECONDS = EIGHT_HOURS_IN_SECONDS;

export const loginRateLimitKeys = (clientIp: string, email: string) => ({
  byIp: `login:ip:${clientIp}`,
  byEmail: `login:email:${email}`,
});
