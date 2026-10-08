import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { INVITATION_TOKEN_PATTERN } from "@/modules/invitation/domain/invitation-rules";
import {
  createInvitationFromForm,
  deleteInvitation,
  getInvitation,
  getInvitations,
  markInvitationAsSent,
  regenerateInvitationLink,
  updateInvitationFromForm,
} from "@/modules/invitation/services/invitation-service";
import { createTestDb, resetDatabase } from "@/test/test-db";

const db = createTestDb();

beforeEach(() => resetDatabase(db));
afterAll(() => db.$disconnect());

async function create(names: string[]) {
  const result = await createInvitationFromForm(db, names);
  if (!result.ok) throw new Error("expected success");
  return result.id;
}

async function addGift() {
  return db.gift.create({
    data: {
      title: "Regalo de prueba",
      imageUrl: "https://test.public.blob.vercel-storage.com/gifts/x.jpg",
      productUrl: "https://tienda.example.com/x",
      referencePriceCents: 100_00,
      quantity: 2,
    },
  });
}

describe("createInvitationFromForm", () => {
  it("creates invitations with 1 and with 5 names, each with its own secure token", async () => {
    const one = await create(["Ana"]);
    const five = await create(["A", "B", "C", "D", "E"]);
    const [a, b] = await Promise.all([
      getInvitation(db, one),
      getInvitation(db, five),
    ]);
    expect(a?.guestNames).toEqual(["Ana"]);
    expect(b?.guestNames).toHaveLength(5);
    expect(a?.token).toMatch(INVITATION_TOKEN_PATTERN);
    expect(a?.token).not.toBe(b?.token);
    expect(a?.rsvpStatus).toBe("PENDING");
  });

  it("rejects an invitation without names and saves nothing", async () => {
    expect(await createInvitationFromForm(db, ["", ""])).toEqual({
      ok: false,
      reason: "invalid",
      error: "Ingresá al menos un nombre.",
    });
    expect(await db.invitation.count()).toBe(0);
  });

  it("the database itself refuses more than five names", async () => {
    await expect(
      db.invitation.create({
        data: {
          token: "t".repeat(43),
          guestNames: ["1", "2", "3", "4", "5", "6"],
        },
      }),
    ).rejects.toThrow();
  });
});

describe("updateInvitationFromForm", () => {
  it("changes the names but keeps the same link", async () => {
    const id = await create(["Ana"]);
    const before = await getInvitation(db, id);
    expect(await updateInvitationFromForm(db, id, ["Ana", "Luis"])).toEqual({
      ok: true,
      id,
    });
    const after = await getInvitation(db, id);
    expect(after?.guestNames).toEqual(["Ana", "Luis"]);
    expect(after?.token).toBe(before?.token);
  });

  it("allows fewer names than confirmed attendees (up to 6 people per invitation)", async () => {
    const id = await create(["Familia Pérez"]);
    await db.invitation.update({
      where: { id },
      data: { rsvpStatus: "ATTENDING", rsvpAttendeesCount: 5 },
    });
    expect(
      await updateInvitationFromForm(db, id, ["Familia Pérez Gómez"]),
    ).toEqual({ ok: true, id });
  });

  it.each(["not-a-uuid", "00000000-0000-4000-8000-00000000abcd"])(
    "returns not_found for %j",
    async (id) => {
      expect(await updateInvitationFromForm(db, id, ["Ana"])).toEqual({
        ok: false,
        reason: "not_found",
      });
    },
  );
});

describe("regenerateInvitationLink", () => {
  it("replaces the token so the old link stops working", async () => {
    const id = await create(["Ana"]);
    const oldToken = (await getInvitation(db, id))?.token;
    expect(await regenerateInvitationLink(db, id)).toBe(true);
    const newToken = (await getInvitation(db, id))?.token;
    expect(newToken).toMatch(INVITATION_TOKEN_PATTERN);
    expect(newToken).not.toBe(oldToken);
    expect(
      await db.invitation.findUnique({ where: { token: oldToken! } }),
    ).toBeNull();
  });

  it("returns false for unknown invitations", async () => {
    expect(
      await regenerateInvitationLink(
        db,
        "00000000-0000-4000-8000-00000000abcd",
      ),
    ).toBe(false);
  });
});

describe("markInvitationAsSent (phase 6, answer 4)", () => {
  const sentVia = async (id: string) =>
    (await db.invitation.findUniqueOrThrow({ where: { id } })).sentVia;

  it("records the last button used", async () => {
    const id = await create(["Ana"]);
    expect(await sentVia(id)).toBeNull();
    expect(await markInvitationAsSent(db, id, "WHATSAPP")).toBe(true);
    expect(await sentVia(id)).toBe("WHATSAPP");
    expect(await markInvitationAsSent(db, id, "EMAIL")).toBe(true);
    expect(await sentVia(id)).toBe("EMAIL");
  });

  it("clears the mark when the link is regenerated: the new link was not sent", async () => {
    const id = await create(["Ana"]);
    await markInvitationAsSent(db, id, "WHATSAPP");
    await regenerateInvitationLink(db, id);
    expect(await sentVia(id)).toBeNull();
  });

  it("rejects unknown channels and ids without touching anything", async () => {
    const id = await create(["Ana"]);
    expect(await markInvitationAsSent(db, id, "SMS")).toBe(false);
    expect(await markInvitationAsSent(db, "not-a-uuid", "EMAIL")).toBe(false);
    expect(
      await markInvitationAsSent(
        db,
        "00000000-0000-4000-8000-00000000abcd",
        "EMAIL",
      ),
    ).toBe(false);
    expect(await sentVia(id)).toBeNull();
  });
});

describe("deleteInvitation", () => {
  it("deletes an invitation without activity", async () => {
    const id = await create(["Ana"]);
    expect(await deleteInvitation(db, id)).toEqual({ ok: true });
    expect(await getInvitation(db, id)).toBeNull();
  });

  it("refuses when the guest already answered the RSVP", async () => {
    const id = await create(["Ana"]);
    await db.invitation.update({
      where: { id },
      data: { rsvpStatus: "NOT_ATTENDING", rsvpAttendeesCount: 0 },
    });
    expect(await deleteInvitation(db, id)).toEqual({
      ok: false,
      reason: "has_activity",
    });
  });

  it("refuses when the guest reserved a gift", async () => {
    const id = await create(["Ana"]);
    const gift = await addGift();
    await db.giftClaim.create({
      data: {
        giftId: gift.id,
        invitationId: id,
        units: 1,
        idempotencyKey: crypto.randomUUID(),
      },
    });
    expect(await deleteInvitation(db, id)).toEqual({
      ok: false,
      reason: "has_activity",
    });
    expect(await getInvitation(db, id)).not.toBeNull();
  });

  it("refuses when the guest declared a contribution", async () => {
    const id = await create(["Ana"]);
    const gift = await addGift();
    await db.contribution.create({
      data: {
        giftId: gift.id,
        invitationId: id,
        amountCents: 5_000,
        idempotencyKey: crypto.randomUUID(),
      },
    });
    expect(await deleteInvitation(db, id)).toEqual({
      ok: false,
      reason: "has_activity",
    });
  });

  it("returns not_found for an unknown id", async () => {
    expect(await deleteInvitation(db, "nope")).toEqual({
      ok: false,
      reason: "not_found",
    });
  });
});

describe("listing", () => {
  it("lists invitations in creation order and flags those with activity", async () => {
    const first = await create(["Primera"]);
    await create(["Segunda"]);
    await db.invitation.update({
      where: { id: first },
      data: { rsvpStatus: "ATTENDING", rsvpAttendeesCount: 1 },
    });
    const list = await getInvitations(db);
    expect(list.map((i) => [i.guestNames[0], i.hasActivity])).toEqual([
      ["Primera", true],
      ["Segunda", false],
    ]);
  });
});
