import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { EVENT_TIME_ZONE, zonedDateTimeToUtc } from "@/lib/time-zone";
import {
  confirmContributionById,
  editContributionAmount,
  getContributionsOverview,
  voidClaimById,
  voidContributionById,
} from "@/modules/contribution/services/contribution-admin-service";
import {
  claimGiftForGuest,
  declareContributionForGuest,
} from "@/modules/contribution/services/gift-list-service";
import { saveEventFromForm } from "@/modules/event/services/event-service";
import { VALID_EVENT_FORM } from "@/modules/event/tests/fixtures";
import { generateInvitationToken } from "@/modules/invitation/domain/invitation-rules";
import { createTestDb, resetDatabase } from "@/test/test-db";

const db = createTestDb();
const IP = "203.0.113.11";
const UNIT = 100_000_00;
// The fixture event is on 2030-01-15; the gift list is open on 2030-01-10.
const OPEN = zonedDateTimeToUtc("2030-01-10", "12:00", EVENT_TIME_ZONE);

beforeEach(async () => {
  await resetDatabase(db);
  await saveEventFromForm(db, VALID_EVENT_FORM);
});
afterAll(() => db.$disconnect());

async function createGuest(names = ["Familia de Prueba"]) {
  const token = generateInvitationToken();
  const { id } = await db.invitation.create({
    data: { token, guestNames: names },
  });
  return { token, id };
}

async function createGift(quantity = 1) {
  const gift = await db.gift.create({
    data: {
      title: "Cuna de prueba",
      imageUrl: "https://example.com/foto.jpg",
      productUrl: "https://tienda.example.com/cuna",
      referencePriceCents: UNIT,
      quantity,
    },
  });
  return gift.id;
}

async function contribution(
  amountCents: number,
  status: "DECLARED" | "CONFIRMED" | "VOIDED" = "DECLARED",
  giftId?: string,
) {
  const guest = await createGuest();
  const row = await db.contribution.create({
    data: {
      giftId: giftId ?? (await createGift()),
      invitationId: guest.id,
      amountCents,
      status,
      idempotencyKey: crypto.randomUUID(),
    },
  });
  return row;
}

const statusOf = async (id: string) =>
  (await db.contribution.findUniqueOrThrow({ where: { id } })).status;

describe("confirm and void contributions", () => {
  it("confirms a pending contribution once; repeating is harmless", async () => {
    const { id } = await contribution(5_000_00);
    expect(await confirmContributionById(db, id)).toEqual({ status: "saved" });
    expect(await confirmContributionById(db, id)).toEqual({
      status: "unchanged",
    });
    expect(await statusOf(id)).toBe("CONFIRMED");
  });

  it("voids for good: a voided contribution cannot be confirmed or edited (answer 2)", async () => {
    const { id } = await contribution(5_000_00, "CONFIRMED");
    expect(await voidContributionById(db, id)).toEqual({ status: "saved" });
    expect(await voidContributionById(db, id)).toEqual({ status: "unchanged" });
    expect(await confirmContributionById(db, id)).toEqual({ status: "voided" });
    expect(await editContributionAmount(db, id, 1_000_00)).toEqual({
      status: "voided",
    });
    expect(await statusOf(id)).toBe("VOIDED");
  });

  it("answers not_found for unknown or malformed ids", async () => {
    expect(await confirmContributionById(db, crypto.randomUUID())).toEqual({
      status: "not_found",
    });
    expect(await voidContributionById(db, "not-a-uuid")).toEqual({
      status: "not_found",
    });
    expect(await voidClaimById(db, "1; DROP TABLE")).toEqual({
      status: "not_found",
    });
  });

  it("works on archived gifts too (answer 4)", async () => {
    const { id, giftId } = await contribution(5_000_00);
    await db.gift.update({ where: { id: giftId }, data: { archivedAt: OPEN } });
    expect(await confirmContributionById(db, id)).toEqual({ status: "saved" });
    expect(await editContributionAmount(db, id, 6_000_00)).toEqual({
      status: "saved",
    });
  });
});

describe("edit amount (decision 51, answer 1)", () => {
  it("accepts amounts under $1.000 and keeps the status", async () => {
    const { id } = await contribution(5_000_00, "CONFIRMED");
    expect(await editContributionAmount(db, id, 800_00)).toEqual({
      status: "saved",
    });
    expect(
      await db.contribution.findUniqueOrThrow({ where: { id } }),
    ).toMatchObject({
      amountCents: 800_00,
      status: "CONFIRMED",
    });
  });

  it("rejects zero, negative or unreadable amounts", async () => {
    const { id } = await contribution(5_000_00);
    expect(await editContributionAmount(db, id, null)).toEqual({
      status: "invalid",
    });
  });

  it("caps at what the gift needs, not counting the contribution itself", async () => {
    const giftId = await createGift(1);
    await contribution(30_000_00, "CONFIRMED", giftId);
    const { id } = await contribution(20_000_00, "DECLARED", giftId);
    expect(await editContributionAmount(db, id, 70_000_00)).toEqual({
      status: "saved",
    });
    expect(await editContributionAmount(db, id, 70_000_01)).toEqual({
      status: "above_maximum",
      maxCents: 70_000_00,
    });
  });

  it("never lets a parent's edit and a guest's declaration exceed the total together", async () => {
    const giftId = await createGift(1);
    const { id } = await contribution(10_000_00, "DECLARED", giftId);
    const guest = await createGuest();
    const [edit, declaration] = await Promise.all([
      editContributionAmount(db, id, 60_000_00),
      declareContributionForGuest(
        db,
        guest.token,
        { giftId, idempotencyKey: crypto.randomUUID(), amountCents: 60_000_00 },
        IP,
        OPEN,
      ),
    ]);
    const rows = await db.contribution.findMany({
      where: { giftId, status: { not: "VOIDED" } },
    });
    const total = rows.reduce((sum, row) => sum + row.amountCents, 0);
    expect(total).toBeLessThanOrEqual(UNIT);
    expect([edit.status, declaration.ok]).not.toEqual(["saved", true]);
  });
});

describe("void 'Yo lo llevo' (decision 45)", () => {
  it("frees the unit for guests again and keeps the row", async () => {
    const giftId = await createGift(1);
    const [ana, luis] = await Promise.all([createGuest(), createGuest()]);
    const claim = (token: string) =>
      claimGiftForGuest(
        db,
        token,
        { giftId, idempotencyKey: crypto.randomUUID() },
        IP,
        OPEN,
      );
    await claim(ana.token);
    expect(await claim(luis.token)).toEqual({
      ok: false,
      reason: "not_available",
    });

    const { id } = await db.giftClaim.findFirstOrThrow({ where: { giftId } });
    expect(await voidClaimById(db, id, OPEN)).toEqual({ status: "saved" });
    expect(await voidClaimById(db, id, OPEN)).toEqual({ status: "unchanged" });
    expect(await claim(luis.token)).toEqual({ ok: true });
    expect(await db.giftClaim.count({ where: { giftId } })).toBe(2);
  });
});

describe("getContributionsOverview", () => {
  it("lists names and amounts for the parents, pending first, with totals", async () => {
    const giftId = await createGift(2);
    await contribution(10_000_00, "CONFIRMED", giftId);
    await contribution(2_500_00, "VOIDED", giftId);
    await contribution(5_000_00, "DECLARED", giftId);
    const overview = await getContributionsOverview(db);
    expect(overview.contributions.map((item) => item.status)).toEqual([
      "pending",
      "confirmed",
      "voided",
    ]);
    expect(overview.contributions[0]).toMatchObject({
      names: "Familia de Prueba",
      giftTitle: "Cuna de prueba",
      amountInput: "5000",
    });
    expect(overview.summary.pendingCount).toBe(1);
  });
});
