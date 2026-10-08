import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { EVENT_TIME_ZONE, zonedDateTimeToUtc } from "@/lib/time-zone";
import { saveEventFromForm } from "@/modules/event/services/event-service";
import { VALID_EVENT_FORM } from "@/modules/event/tests/fixtures";
import { generateInvitationToken } from "@/modules/invitation/domain/invitation-rules";
import { getGuestInvitation } from "@/modules/invitation/services/guest-invitation-service";
import {
  INVALID_TOKEN_RATE_LIMIT,
  RSVP_CHANGE_RATE_LIMIT,
} from "@/modules/rsvp/domain/rsvp-rules";
import { submitRsvp } from "@/modules/rsvp/services/rsvp-service";
import { createTestDb, resetDatabase } from "@/test/test-db";

const db = createTestDb();
const IP = "203.0.113.7";
// The fixture event is on 2030-01-15 at 16:30 (Argentina).
const OPEN = zonedDateTimeToUtc("2030-01-10", "12:00", EVENT_TIME_ZONE);
const LAST_MINUTE = zonedDateTimeToUtc("2030-01-14", "23:59", EVENT_TIME_ZONE);
const CLOSED = zonedDateTimeToUtc("2030-01-15", "00:00", EVENT_TIME_ZONE);

const yes = (attendees: number) => ({ attending: true as const, attendees });
const no = { attending: false as const, attendees: 0 as const };

let token: string;

beforeEach(async () => {
  await resetDatabase(db);
  await saveEventFromForm(db, VALID_EVENT_FORM);
  token = generateInvitationToken();
  await db.invitation.create({
    data: { token, guestNames: ["Familia Pérez"] },
  });
});
afterAll(() => db.$disconnect());

const stored = () => db.invitation.findUniqueOrThrow({ where: { token } });

describe("submitRsvp", () => {
  it("saves 'yes' with up to 6 people, even if the invitation has a single name", async () => {
    expect(await submitRsvp(db, token, yes(6), IP, OPEN)).toEqual({
      ok: true,
      answer: yes(6),
    });
    expect(await stored()).toMatchObject({
      rsvpStatus: "ATTENDING",
      rsvpAttendeesCount: 6,
      rsvpUpdatedAt: OPEN,
    });
  });

  it("saves 'no' and lets the guest change their mind before the deadline", async () => {
    await submitRsvp(db, token, no, IP, OPEN);
    expect(await stored()).toMatchObject({
      rsvpStatus: "NOT_ATTENDING",
      rsvpAttendeesCount: 0,
    });
    await submitRsvp(db, token, yes(2), IP, LAST_MINUTE);
    expect(await stored()).toMatchObject({
      rsvpStatus: "ATTENDING",
      rsvpAttendeesCount: 2,
    });
  });

  it("closes for everyone at 00:00 of the event day, including guests who never answered", async () => {
    expect(await submitRsvp(db, token, yes(1), IP, CLOSED)).toEqual({
      ok: false,
      reason: "closed",
    });
    expect((await stored()).rsvpStatus).toBe("PENDING");
  });

  it("rejects an invalid answer without saving", async () => {
    expect(await submitRsvp(db, token, null, IP, OPEN)).toEqual({
      ok: false,
      reason: "invalid",
    });
    expect((await stored()).rsvpStatus).toBe("PENDING");
  });

  it("is idempotent under a double click", async () => {
    const results = await Promise.all([
      submitRsvp(db, token, yes(3), IP, OPEN),
      submitRsvp(db, token, yes(3), IP, OPEN),
    ]);
    expect(results.every((r) => r.ok)).toBe(true);
    expect(await stored()).toMatchObject({
      rsvpStatus: "ATTENDING",
      rsvpAttendeesCount: 3,
    });
  });

  it("keeps a consistent final state when different answers race", async () => {
    await Promise.all([
      submitRsvp(db, token, yes(4), IP, OPEN),
      submitRsvp(db, token, no, IP, OPEN),
    ]);
    const final = await stored();
    expect([
      ["ATTENDING", 4],
      ["NOT_ATTENDING", 0],
    ]).toContainEqual([final.rsvpStatus, final.rsvpAttendeesCount]);
  });

  it("limits how many times an invitation can change its answer", async () => {
    for (let i = 0; i < RSVP_CHANGE_RATE_LIMIT.limit; i++) {
      expect((await submitRsvp(db, token, yes(1), IP, OPEN)).ok).toBe(true);
    }
    expect(await submitRsvp(db, token, no, IP, OPEN)).toEqual({
      ok: false,
      reason: "rate_limited",
    });
  });

  it.each(["short", "x".repeat(43), generateInvitationToken()])(
    "returns not_found for unknown token %#",
    async (unknown) => {
      expect(await submitRsvp(db, unknown, yes(1), IP, OPEN)).toEqual({
        ok: false,
        reason: "not_found",
      });
    },
  );

  it("does not create rate-limit rows for unknown tokens beyond the per-IP counter", async () => {
    for (let i = 0; i < 5; i++)
      await submitRsvp(db, generateInvitationToken(), yes(1), IP, OPEN);
    expect(await db.rateLimitBucket.count()).toBe(1);
  });

  it("the database rejects inconsistent answers", async () => {
    await expect(
      db.invitation.update({
        where: { token },
        data: { rsvpStatus: "ATTENDING", rsvpAttendeesCount: 7 },
      }),
    ).rejects.toThrow();
    await expect(
      db.invitation.update({
        where: { token },
        data: { rsvpStatus: "ATTENDING", rsvpAttendeesCount: 0 },
      }),
    ).rejects.toThrow();
    await expect(
      db.invitation.update({
        where: { token },
        data: { rsvpStatus: "NOT_ATTENDING", rsvpAttendeesCount: 2 },
      }),
    ).rejects.toThrow();
  });
});

describe("getGuestInvitation", () => {
  it("returns the public view for a valid link", async () => {
    const result = await getGuestInvitation(db, token, IP, OPEN);
    expect(result).toMatchObject({
      status: "found",
      invitation: { guestNamesLabel: "Familia Pérez", rsvpOpen: true },
    });
  });

  it("answers the same for malformed and unknown links", async () => {
    expect(await getGuestInvitation(db, "nope", IP, OPEN)).toEqual({
      status: "not_found",
    });
    expect(
      await getGuestInvitation(db, generateInvitationToken(), IP, OPEN),
    ).toEqual({ status: "not_found" });
  });

  it("blocks an IP that tries too many invalid links, even for a valid link afterwards", async () => {
    for (let i = 0; i <= INVALID_TOKEN_RATE_LIMIT.limit; i++) {
      await getGuestInvitation(db, generateInvitationToken(), IP, OPEN);
    }
    expect(await getGuestInvitation(db, token, IP, OPEN)).toEqual({
      status: "not_found",
    });
    expect(
      (await getGuestInvitation(db, token, "198.51.100.1", OPEN)).status,
    ).toBe("found");
    const later = new Date(OPEN.getTime() + INVALID_TOKEN_RATE_LIMIT.windowMs);
    expect((await getGuestInvitation(db, token, IP, later)).status).toBe(
      "found",
    );
  });

  it("does not count valid visits against the IP", async () => {
    for (let i = 0; i < 30; i++) await getGuestInvitation(db, token, IP, OPEN);
    expect((await getGuestInvitation(db, token, IP, OPEN)).status).toBe(
      "found",
    );
  });

  it("shows a neutral page while the event is not configured", async () => {
    await db.event.deleteMany();
    expect(await getGuestInvitation(db, token, IP, OPEN)).toEqual({
      status: "event_not_ready",
    });
  });
});
