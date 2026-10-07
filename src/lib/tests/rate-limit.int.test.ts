import { afterAll, beforeEach, describe, expect, it } from "vitest";
import {
  consumeRateLimit,
  hashRateLimitKey,
  resetRateLimit,
} from "@/lib/rate-limit";
import { createTestDb, resetDatabase } from "@/test/test-db";

const db = createTestDb();
const RULE = { limit: 3, windowMs: 60_000 };
const KEY = "login:email:someone@example.com";

beforeEach(() => resetDatabase(db));
afterAll(() => db.$disconnect());

describe("consumeRateLimit", () => {
  it("allows hits up to the limit and blocks the next one", async () => {
    const now = new Date("2026-01-01T00:00:00Z");
    const results = [];
    for (let i = 0; i < RULE.limit + 1; i++)
      results.push(await consumeRateLimit(db, KEY, RULE, now));
    expect(results.map((r) => r.allowed)).toEqual([true, true, true, false]);
    expect(results.at(-1)?.retryAfterMs).toBe(RULE.windowMs);
  });

  it("starts a new window once the previous one expires", async () => {
    const start = new Date("2026-01-01T00:00:00Z");
    for (let i = 0; i < RULE.limit + 1; i++)
      await consumeRateLimit(db, KEY, RULE, start);
    const later = new Date(start.getTime() + RULE.windowMs);
    expect((await consumeRateLimit(db, KEY, RULE, later)).allowed).toBe(true);
  });

  it("counts concurrent hits exactly (no lost updates)", async () => {
    const now = new Date("2026-01-01T00:00:00Z");
    const concurrentHits = 10;
    const results = await Promise.all(
      Array.from({ length: concurrentHits }, () =>
        consumeRateLimit(db, KEY, RULE, now),
      ),
    );
    expect(results.filter((r) => r.allowed)).toHaveLength(RULE.limit);
    const bucket = await db.rateLimitBucket.findUniqueOrThrow({
      where: { key: hashRateLimitKey(KEY) },
    });
    expect(bucket.count).toBe(concurrentHits);
  });

  it("stores only a hash of the key, never the raw value", async () => {
    await consumeRateLimit(db, KEY, RULE);
    const keys = (await db.rateLimitBucket.findMany()).map(
      (bucket) => bucket.key,
    );
    expect(keys).toEqual([hashRateLimitKey(KEY)]);
    expect(keys.join()).not.toContain("example.com");
  });

  it("resetRateLimit clears the counter", async () => {
    for (let i = 0; i < RULE.limit + 1; i++)
      await consumeRateLimit(db, KEY, RULE);
    await resetRateLimit(db, KEY);
    expect((await consumeRateLimit(db, KEY, RULE)).allowed).toBe(true);
  });
});
