import { describe, expect, it } from "vitest";
import {
  type RsvpRow,
  sortForFollowUp,
  summarizeRsvps,
} from "@/modules/rsvp/domain/rsvp-summary";
import { toRsvpListItem } from "@/modules/rsvp/dto/rsvp-admin-dto";

let order = 0;
const row = (overrides: Partial<RsvpRow>): RsvpRow => ({
  id: `i${order}`,
  guestNames: ["Ana"],
  rsvpStatus: "PENDING",
  rsvpAttendeesCount: null,
  rsvpUpdatedAt: null,
  createdAt: new Date(Date.UTC(2030, 0, 1, 0, order++)),
  ...overrides,
});

describe("summarizeRsvps", () => {
  it("counts people who come, and invitations and names for no / pending", () => {
    const rows = [
      row({
        rsvpStatus: "ATTENDING",
        rsvpAttendeesCount: 4,
        guestNames: ["Familia Pérez"],
      }),
      row({
        rsvpStatus: "ATTENDING",
        rsvpAttendeesCount: 2,
        guestNames: ["Ana", "Luis"],
      }),
      row({
        rsvpStatus: "NOT_ATTENDING",
        rsvpAttendeesCount: 0,
        guestNames: ["Sofía", "Tomás", "Mía"],
      }),
      row({ guestNames: ["Abuela"] }),
      row({ guestNames: ["Tío", "Tía"] }),
    ];
    expect(summarizeRsvps(rows)).toEqual({
      attending: { people: 6, invitations: 2 },
      notAttending: { invitations: 1, names: 3 },
      pending: { invitations: 2, names: 3 },
    });
  });

  it("returns zeros with no invitations", () => {
    expect(summarizeRsvps([])).toEqual({
      attending: { people: 0, invitations: 0 },
      notAttending: { invitations: 0, names: 0 },
      pending: { invitations: 0, names: 0 },
    });
  });
});

describe("sortForFollowUp", () => {
  it("puts pending first, then yes, then no, each in creation order", () => {
    const a = row({ rsvpStatus: "NOT_ATTENDING", rsvpAttendeesCount: 0 });
    const b = row({ rsvpStatus: "ATTENDING", rsvpAttendeesCount: 1 });
    const c = row({});
    const d = row({});
    expect(sortForFollowUp([a, b, c, d]).map((r) => r.id)).toEqual([
      c.id,
      d.id,
      b.id,
      a.id,
    ]);
  });
});

describe("toRsvpListItem", () => {
  it.each([
    [
      { rsvpStatus: "ATTENDING" as const, rsvpAttendeesCount: 1 },
      "Vienen 1 persona",
    ],
    [
      { rsvpStatus: "ATTENDING" as const, rsvpAttendeesCount: 5 },
      "Vienen 5 personas",
    ],
    [
      { rsvpStatus: "NOT_ATTENDING" as const, rsvpAttendeesCount: 0 },
      "No vienen",
    ],
    [{}, "Falta responder"],
  ])("labels %j", (overrides, label) => {
    expect(toRsvpListItem(row(overrides)).statusLabel).toBe(label);
  });

  it("shows when the guest answered, in Argentina time", () => {
    const item = toRsvpListItem(
      row({
        rsvpStatus: "ATTENDING",
        rsvpAttendeesCount: 2,
        rsvpUpdatedAt: new Date("2030-11-05T23:30:00Z"),
      }),
    );
    expect(item.answeredAt).toMatch(/^5 nov\.?,? 20:30$/);
  });
});
