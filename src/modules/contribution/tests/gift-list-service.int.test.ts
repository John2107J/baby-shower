import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { EVENT_TIME_ZONE, zonedDateTimeToUtc } from "@/lib/time-zone";
import { formatCentsAsArs } from "@/lib/money";
import {
  GIFT_ACTION_RATE_LIMIT,
  MIN_INTERVAL_BETWEEN_CONTRIBUTIONS_MS,
} from "@/modules/contribution/domain/gift-list-rules";
import {
  claimGiftForGuest,
  declareContributionForGuest,
  getGuestGiftList,
} from "@/modules/contribution/services/gift-list-service";
import { saveEventFromForm } from "@/modules/event/services/event-service";
import { VALID_EVENT_FORM } from "@/modules/event/tests/fixtures";
import { generateInvitationToken } from "@/modules/invitation/domain/invitation-rules";
import { createTestDb, resetDatabase } from "@/test/test-db";

const db = createTestDb();
const IP = "203.0.113.9";
const UNIT = 100_000_00; // $100.000
// The fixture event is on 2030-01-15 at 16:30 (Argentina).
const OPEN = zonedDateTimeToUtc("2030-01-10", "12:00", EVENT_TIME_ZONE);
const LAST_MINUTE = zonedDateTimeToUtc("2030-01-15", "16:29", EVENT_TIME_ZONE);
const CLOSED = zonedDateTimeToUtc("2030-01-15", "16:30", EVENT_TIME_ZONE);

beforeEach(async () => {
  await resetDatabase(db);
  await saveEventFromForm(db, VALID_EVENT_FORM);
});
afterAll(() => db.$disconnect());

async function createGuest(names = ["Invitado de Prueba"]) {
  const token = generateInvitationToken();
  const { id } = await db.invitation.create({
    data: { token, guestNames: names },
  });
  return { token, id };
}

async function createGift(quantity = 1, archived = false) {
  const gift = await db.gift.create({
    data: {
      title: `Regalo ${crypto.randomUUID()}`,
      imageUrl: "https://example.com/foto.jpg",
      productUrl: "https://tienda.example.com/producto",
      referencePriceCents: UNIT,
      quantity,
      archivedAt: archived ? OPEN : null,
    },
  });
  return gift.id;
}

const claim = (
  token: string,
  giftId: string,
  now = OPEN,
  key = crypto.randomUUID(),
) => claimGiftForGuest(db, token, { giftId, idempotencyKey: key }, IP, now);

const contribute = (
  token: string,
  giftId: string,
  amountCents: number,
  now = OPEN,
  key = crypto.randomUUID(),
) =>
  declareContributionForGuest(
    db,
    token,
    { giftId, idempotencyKey: key, amountCents },
    IP,
    now,
  );

async function confirmAll() {
  await db.contribution.updateMany({ data: { status: "CONFIRMED" } });
}

async function giftView(token: string, giftId: string, now = OPEN) {
  const result = await getGuestGiftList(db, token, IP, now);
  if (result.status !== "found") throw new Error("expected the list");
  return result.list.gifts.find((gift) => gift.id === giftId)!;
}

describe("Yo lo llevo", () => {
  it("reserves one unit and moves the bar to the next one", async () => {
    const guest = await createGuest();
    const giftId = await createGift(2);
    expect(await claim(guest.token, giftId)).toEqual({ ok: true });
    expect((await giftView(guest.token, giftId)).progress).toMatchObject({
      state: "open",
      unitLabel: "Unidad 2 de 2",
      canClaim: true,
    });
  });

  it("lets only one of two simultaneous guests take the last unit", async () => {
    const [ana, luis] = await Promise.all([createGuest(), createGuest()]);
    const giftId = await createGift(1);
    const results = await Promise.all([
      claim(ana.token, giftId),
      claim(luis.token, giftId),
    ]);
    expect(results).toContainEqual({ ok: true });
    expect(results).toContainEqual({ ok: false, reason: "not_available" });
    expect(await db.giftClaim.count({ where: { giftId } })).toBe(1);
  });

  it("saves a double click once and answers both as success", async () => {
    const guest = await createGuest();
    const giftId = await createGift(2);
    const key = crypto.randomUUID();
    const results = await Promise.all([
      claim(guest.token, giftId, OPEN, key),
      claim(guest.token, giftId, OPEN, key),
    ]);
    expect(results).toEqual([{ ok: true }, { ok: true }]);
    expect(await claim(guest.token, giftId, OPEN, key)).toEqual({ ok: true });
    expect(await db.giftClaim.count({ where: { giftId } })).toBe(1);
  });

  it("is blocked when the only unit already has money, even pending (decision 40)", async () => {
    const [ana, luis] = await Promise.all([createGuest(), createGuest()]);
    const giftId = await createGift(1);
    expect(await contribute(ana.token, giftId, 1_000_00)).toEqual({ ok: true });
    expect(await claim(luis.token, giftId)).toEqual({
      ok: false,
      reason: "not_available",
    });
  });

  it("ignores claims voided by the parents (decision 45)", async () => {
    const [ana, luis] = await Promise.all([createGuest(), createGuest()]);
    const giftId = await createGift(1);
    await claim(ana.token, giftId);
    await db.giftClaim.updateMany({ data: { voidedAt: OPEN } });
    expect(await claim(luis.token, giftId)).toEqual({ ok: true });
  });
});

describe("Aportar dinero", () => {
  it("rejects zero, amounts under $1.000 and more than what is left", async () => {
    const guest = await createGuest();
    const giftId = await createGift(1);
    expect(await contribute(guest.token, giftId, 0)).toEqual({
      ok: false,
      reason: "below_minimum",
    });
    expect(await contribute(guest.token, giftId, 999_99)).toEqual({
      ok: false,
      reason: "below_minimum",
    });
    expect(await contribute(guest.token, giftId, UNIT + 1)).toEqual({
      ok: false,
      reason: "above_maximum",
    });
    expect(await db.contribution.count()).toBe(0);
  });

  it("caps declarations by pending money too (decision 42)", async () => {
    const [ana, luis] = await Promise.all([createGuest(), createGuest()]);
    const giftId = await createGift(1);
    expect(await contribute(ana.token, giftId, 60_000_00)).toEqual({
      ok: true,
    });
    expect(await contribute(luis.token, giftId, 40_000_01)).toEqual({
      ok: false,
      reason: "above_maximum",
    });
    expect(await contribute(luis.token, giftId, 40_000_00)).toEqual({
      ok: true,
    });
    expect((await giftView(luis.token, giftId)).progress).toMatchObject({
      state: "awaiting_confirmation",
      percent: 0,
    });
  });

  it("never lets two simultaneous contributions exceed the total", async () => {
    const [ana, luis] = await Promise.all([createGuest(), createGuest()]);
    const giftId = await createGift(1);
    const results = await Promise.all([
      contribute(ana.token, giftId, 60_000_00),
      contribute(luis.token, giftId, 60_000_00),
    ]);
    expect(results).toContainEqual({ ok: true });
    expect(results).toContainEqual({ ok: false, reason: "above_maximum" });
    expect(await db.contribution.count()).toBe(1);
  });

  it("only moves the bar with confirmed money and completes the gift at the end of the list", async () => {
    const guest = await createGuest();
    const first = await createGift(1);
    const second = await createGift(1);
    await contribute(guest.token, first, UNIT);
    let result = await getGuestGiftList(db, guest.token, IP, OPEN);
    if (result.status !== "found") throw new Error("expected the list");
    expect(result.list.gifts.map((gift) => gift.id)).toEqual([first, second]);

    await confirmAll();
    result = await getGuestGiftList(db, guest.token, IP, OPEN);
    if (result.status !== "found") throw new Error("expected the list");
    expect(result.list.gifts.map((gift) => gift.id)).toEqual([second, first]);
    expect(result.list.gifts[1]!.progress).toEqual({ state: "complete" });
  });

  it("saves a double click once without hitting the rate limit", async () => {
    const guest = await createGuest();
    const giftId = await createGift(1);
    const key = crypto.randomUUID();
    expect(await contribute(guest.token, giftId, 5_000_00, OPEN, key)).toEqual({
      ok: true,
    });
    expect(await contribute(guest.token, giftId, 5_000_00, OPEN, key)).toEqual({
      ok: true,
    });
    expect(await db.contribution.count()).toBe(1);
  });

  it("allows another contribution only 3 minutes after the last saved one", async () => {
    const guest = await createGuest();
    const giftId = await createGift(2);
    expect(await contribute(guest.token, giftId, 0)).toMatchObject({
      ok: false,
    });
    expect(await contribute(guest.token, giftId, 5_000_00)).toEqual({
      ok: true,
    });
    const almost = new Date(
      OPEN.getTime() + MIN_INTERVAL_BETWEEN_CONTRIBUTIONS_MS - 1,
    );
    expect(await contribute(guest.token, giftId, 5_000_00, almost)).toEqual({
      ok: false,
      reason: "too_soon",
    });
    const later = new Date(
      OPEN.getTime() + MIN_INTERVAL_BETWEEN_CONTRIBUTIONS_MS,
    );
    expect(await contribute(guest.token, giftId, 5_000_00, later)).toEqual({
      ok: true,
    });
  });

  it("applies the 3 minutes across gifts, even for simultaneous requests", async () => {
    const guest = await createGuest();
    const [first, second] = await Promise.all([createGift(1), createGift(1)]);
    const results = await Promise.all([
      contribute(guest.token, first, 5_000_00),
      contribute(guest.token, second, 5_000_00),
    ]);
    expect(results).toContainEqual({ ok: true });
    expect(results).toContainEqual({ ok: false, reason: "too_soon" });
  });
});

describe("shared rules", () => {
  it("treats archived gifts as missing", async () => {
    const guest = await createGuest();
    const giftId = await createGift(1, true);
    expect(await claim(guest.token, giftId)).toEqual({
      ok: false,
      reason: "gift_not_found",
    });
    expect(await contribute(guest.token, giftId, 5_000_00)).toEqual({
      ok: false,
      reason: "gift_not_found",
    });
    const result = await getGuestGiftList(db, guest.token, IP, OPEN);
    expect(result.status === "found" && result.list.gifts).toEqual([]);
  });

  it("closes when the event starts (owner's answer 4 in phase 5)", async () => {
    const guest = await createGuest();
    const giftId = await createGift(2);
    expect(await claim(guest.token, giftId, LAST_MINUTE)).toEqual({ ok: true });
    expect(await claim(guest.token, giftId, CLOSED)).toEqual({
      ok: false,
      reason: "closed",
    });
    expect(await contribute(guest.token, giftId, 5_000_00, CLOSED)).toEqual({
      ok: false,
      reason: "closed",
    });
    const result = await getGuestGiftList(db, guest.token, IP, CLOSED);
    expect(result.status === "found" && result.list.open).toBe(false);
  });

  it("answers unknown links exactly like missing ones and counts them against the IP", async () => {
    const giftId = await createGift(1);
    const unknown = generateInvitationToken();
    expect(await claim(unknown, giftId)).toEqual({
      ok: false,
      reason: "not_found",
    });
    expect(await contribute("short", giftId, 5_000_00)).toEqual({
      ok: false,
      reason: "not_found",
    });
    expect(await getGuestGiftList(db, unknown, IP, OPEN)).toEqual({
      status: "not_found",
    });
    expect(await db.rateLimitBucket.count()).toBe(1);
  });

  it("limits attempts to 20 per invitation every 10 minutes", async () => {
    const guest = await createGuest();
    const giftId = await createGift(1);
    for (let i = 0; i < GIFT_ACTION_RATE_LIMIT.limit; i++)
      await contribute(guest.token, giftId, 0);
    expect(await claim(guest.token, giftId)).toEqual({
      ok: false,
      reason: "rate_limited",
    });
  });

  it("rejects a key already used for another gift", async () => {
    const guest = await createGuest();
    const [first, second] = await Promise.all([createGift(2), createGift(2)]);
    const key = crypto.randomUUID();
    await claim(guest.token, first, OPEN, key);
    expect(await claim(guest.token, second, OPEN, key)).toEqual({
      ok: false,
      reason: "invalid",
    });
  });
});

describe("privacy (CLAUDE.md §3.5)", () => {
  it("never sends other guests' names or amounts; each guest sees only their own choices", async () => {
    const secretGuest = await createGuest(["Nombre Secreto", "Otro Secreto"]);
    const me = await createGuest(["Invitada Curiosa"]);
    const giftId = await createGift(2);
    const other = await createGift(1);
    await contribute(secretGuest.token, giftId, 12_345_00);
    await claim(secretGuest.token, other);
    await confirmAll();
    await contribute(me.token, giftId, 7_000_00);

    const result = await getGuestGiftList(db, me.token, IP, OPEN);
    if (result.status !== "found") throw new Error("expected the list");
    const serialized = JSON.stringify(result.list);
    for (const leaked of [
      "Nombre Secreto",
      "Otro Secreto",
      "Invitada Curiosa",
      "12.345",
      "1234500",
      secretGuest.id,
      secretGuest.token,
      me.id,
      me.token,
    ]) {
      expect(serialized).not.toContain(leaked);
    }
    expect(result.list.ownCommitments).toEqual([
      {
        kind: "contribution",
        giftTitle: expect.any(String),
        amountLabel: formatCentsAsArs(7_000_00),
        confirmed: false,
      },
    ]);
  });
});
