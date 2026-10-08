import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { consumeRateLimit, isRateLimited } from "@/lib/rate-limit";
import { createTestDb, resetDatabase } from "@/test/test-db";

const db = createTestDb();
const RULE = { limit: 2, windowMs: 60_000 };
const NOW = new Date("2030-01-01T00:00:00Z");

beforeEach(() => resetDatabase(db));
afterAll(() => db.$disconnect());

describe("isRateLimited", () => {
  it("does not count a hit and only reports blocked once over the limit within the window", async () => {
    expect(await isRateLimited(db, "k", RULE, NOW)).toBe(false);
    for (let i = 0; i < RULE.limit; i++)
      await consumeRateLimit(db, "k", RULE, NOW);
    expect(await isRateLimited(db, "k", RULE, NOW)).toBe(false);
    await consumeRateLimit(db, "k", RULE, NOW);
    expect(await isRateLimited(db, "k", RULE, NOW)).toBe(true);
    expect(
      await isRateLimited(
        db,
        "k",
        RULE,
        new Date(NOW.getTime() + RULE.windowMs),
      ),
    ).toBe(false);
    expect((await db.rateLimitBucket.findFirstOrThrow()).count).toBe(
      RULE.limit + 1,
    );
  });
});
