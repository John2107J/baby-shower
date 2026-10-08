import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { EVENT_TIME_ZONE, zonedDateTimeToUtc } from "@/lib/time-zone";
import { confirmContributionById } from "@/modules/contribution/services/contribution-admin-service";
import {
  claimGiftForGuest,
  declareContributionForGuest,
} from "@/modules/contribution/services/gift-list-service";
import { saveEventFromForm } from "@/modules/event/services/event-service";
import { VALID_EVENT_FORM } from "@/modules/event/tests/fixtures";
import { generateInvitationToken } from "@/modules/invitation/domain/invitation-rules";
import { submitRsvp } from "@/modules/rsvp/services/rsvp-service";
import { createTestDb, resetDatabase } from "@/test/test-db";

// Timings for whoever runs the test; no personal data involved.
const report = (line: string) => process.stdout.write(`${line}\n`);

/**
 * Light load test (phase 7): 120 fictitious guests act at the same time.
 * Checks the business invariants under concurrency, not speed.
 * Run with: TEST_DATABASE_URL=... npm run test:load
 */
const db = createTestDb();
const GUESTS = 120;
const IP = "203.0.113.50";
const UNIT = 100_000_00;
// The fixture event is on 2030-01-15; everything here happens before the deadline.
const OPEN = zonedDateTimeToUtc("2030-01-10", "12:00", EVENT_TIME_ZONE);

let tokens: string[] = [];
let gifts: { id: string; quantity: number }[] = [];

beforeAll(async () => {
  await resetDatabase(db);
  await saveEventFromForm(db, VALID_EVENT_FORM);
  tokens = Array.from({ length: GUESTS }, generateInvitationToken);
  await db.invitation.createMany({
    data: tokens.map((token, i) => ({ token, guestNames: [`Invitado ${i}`] })),
  });
  gifts = await Promise.all(
    [1, 2, 3, 5].map(async (quantity) => {
      const gift = await db.gift.create({
        data: {
          title: `Regalo x${quantity}`,
          imageUrl: "https://example.com/foto.jpg",
          productUrl: "https://tienda.example.com/x",
          referencePriceCents: UNIT,
          quantity,
        },
      });
      return { id: gift.id, quantity };
    }),
  );
});
afterAll(() => db.$disconnect());

/** Decisions 38–42 must hold for every gift whatever the order of events. */
async function expectInvariants() {
  for (const gift of gifts) {
    const claimed =
      (
        await db.giftClaim.aggregate({
          where: { giftId: gift.id, voidedAt: null },
          _sum: { units: true },
        })
      )._sum.units ?? 0;
    const money =
      (
        await db.contribution.aggregate({
          where: { giftId: gift.id, status: { not: "VOIDED" } },
          _sum: { amountCents: true },
        })
      )._sum.amountCents ?? 0;
    // Never more than the total, and never a claimed unit that already had money.
    expect(claimed * UNIT + money).toBeLessThanOrEqual(gift.quantity * UNIT);
    expect(claimed + Math.ceil(money / UNIT)).toBeLessThanOrEqual(
      gift.quantity,
    );
  }
}

const pick = <T>(items: T[], i: number) => items[i % items.length]!;

describe("120 guests at once", () => {
  it("claims and contributions never exceed any gift, and nothing crashes", async () => {
    const started = performance.now();
    const results = await Promise.all(
      tokens.map((token, i) => {
        const giftId = pick(gifts, i).id;
        const idempotencyKey = crypto.randomUUID();
        return i % 2 === 0
          ? claimGiftForGuest(db, token, { giftId, idempotencyKey }, IP, OPEN)
          : declareContributionForGuest(
              db,
              token,
              {
                giftId,
                idempotencyKey,
                amountCents: (1 + (i % 7)) * 15_000_00,
              },
              IP,
              OPEN,
            );
      }),
    );
    const elapsed = Math.round(performance.now() - started);
    const reasons = results.map((r) => (r.ok ? "ok" : r.reason));
    const tally = Object.fromEntries(
      [...new Set(reasons)].map((r) => [
        r,
        reasons.filter((x) => x === r).length,
      ]),
    );
    report(
      `claims + contributions: ${GUESTS} in ${elapsed} ms ${JSON.stringify(tally)}`,
    );

    // Only expected business answers: no errors, no rate limits for normal guests.
    for (const reason of reasons)
      expect([
        "ok",
        "not_available",
        "above_maximum",
        "nothing_left",
      ]).toContain(reason);
    expect(tally["ok"]).toBeGreaterThan(0);
    await expectInvariants();
  });

  it("the parents confirming while guests keep contributing keeps every limit", async () => {
    const pending = await db.contribution.findMany({
      where: { status: "DECLARED" },
      select: { id: true },
    });
    // Guests who have not contributed yet (odd ones already did, 3 minutes apart).
    const later = new Date(OPEN.getTime() + 60 * 60 * 1000);
    await Promise.all([
      ...pending.map(({ id }) => confirmContributionById(db, id)),
      ...tokens.map((token, i) =>
        declareContributionForGuest(
          db,
          token,
          {
            giftId: pick(gifts, i + 1).id,
            idempotencyKey: crypto.randomUUID(),
            amountCents: 5_000_00,
          },
          IP,
          later,
        ),
      ),
    ]);
    await expectInvariants();
  });

  it("RSVPs from every guest at once are all saved", async () => {
    const started = performance.now();
    const results = await Promise.all(
      tokens.map((token, i) =>
        submitRsvp(
          db,
          token,
          i % 3 === 0
            ? { attending: false, attendees: 0 }
            : { attending: true, attendees: 1 + (i % 6) },
          IP,
          OPEN,
        ),
      ),
    );
    report(`RSVPs: ${GUESTS} in ${Math.round(performance.now() - started)} ms`);
    expect(results.every((r) => r.ok)).toBe(true);
    expect(
      await db.invitation.count({ where: { rsvpStatus: "PENDING" } }),
    ).toBe(0);
  });
});
