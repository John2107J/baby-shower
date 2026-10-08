import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { generateInvitationToken } from "@/modules/invitation/domain/invitation-rules";
import { getRsvpOverview } from "@/modules/rsvp/services/rsvp-summary-service";
import { createTestDb, resetDatabase } from "@/test/test-db";

const db = createTestDb();

beforeEach(() => resetDatabase(db));
afterAll(() => db.$disconnect());

const invite = (guestNames: string[], data: object = {}) =>
  db.invitation.create({
    data: { token: generateInvitationToken(), guestNames, ...data },
  });

describe("getRsvpOverview", () => {
  it("summarizes the real data and lists pending invitations first", async () => {
    await invite(["Familia Pérez"], {
      rsvpStatus: "ATTENDING",
      rsvpAttendeesCount: 6,
      rsvpUpdatedAt: new Date(),
    });
    await invite(["Ana", "Luis"], {
      rsvpStatus: "NOT_ATTENDING",
      rsvpAttendeesCount: 0,
      rsvpUpdatedAt: new Date(),
    });
    await invite(["Abuela"]);

    const { summary, items } = await getRsvpOverview(db);
    expect(summary).toEqual({
      attending: { people: 6, invitations: 1 },
      notAttending: { invitations: 1, names: 2 },
      pending: { invitations: 1, names: 1 },
    });
    expect(items.map((item) => [item.names, item.statusLabel])).toEqual([
      ["Abuela", "Falta responder"],
      ["Familia Pérez", "Vienen 6 personas"],
      ["Ana, Luis", "No vienen"],
    ]);
  });
});
