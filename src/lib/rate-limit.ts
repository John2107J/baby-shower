import { createHash } from "node:crypto";
import type { PrismaClient } from "@/generated/prisma/client";

export type RateLimitRule = {
  /** Maximum number of hits allowed inside one window. */
  limit: number;
  windowMs: number;
};

export type RateLimitResult = {
  allowed: boolean;
  retryAfterMs: number;
};

// Keys may contain personal data (emails, IPs); only their hash is stored.
export function hashRateLimitKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

/**
 * Atomically counts one hit for `key` in a fixed window and reports whether
 * it is within the limit. A single UPSERT keeps concurrent hits consistent.
 */
export async function consumeRateLimit(
  db: PrismaClient,
  key: string,
  rule: RateLimitRule,
  now: Date = new Date(),
): Promise<RateLimitResult> {
  const windowThreshold = new Date(now.getTime() - rule.windowMs);
  const rows = await db.$queryRaw<{ count: number; windowStart: Date }[]>`
    INSERT INTO "RateLimitBucket" ("key", "windowStart", "count")
    VALUES (${hashRateLimitKey(key)}, ${now}, 1)
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE WHEN "RateLimitBucket"."windowStart" <= ${windowThreshold}
                     THEN 1 ELSE "RateLimitBucket"."count" + 1 END,
      "windowStart" = CASE WHEN "RateLimitBucket"."windowStart" <= ${windowThreshold}
                           THEN ${now} ELSE "RateLimitBucket"."windowStart" END
    RETURNING "count", "windowStart"`;

  const row = rows[0];
  if (!row) throw new Error("Rate limit upsert returned no row");

  const allowed = row.count <= rule.limit;
  const retryAfterMs = allowed
    ? 0
    : Math.max(0, row.windowStart.getTime() + rule.windowMs - now.getTime());
  return { allowed, retryAfterMs };
}

export async function resetRateLimit(
  db: PrismaClient,
  key: string,
): Promise<void> {
  await db.rateLimitBucket.deleteMany({
    where: { key: hashRateLimitKey(key) },
  });
}
