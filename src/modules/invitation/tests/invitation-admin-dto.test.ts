import { describe, expect, it } from "vitest";
import { toAdminInvitationView } from "@/modules/invitation/dto/invitation-admin-dto";

const base = {
  id: "i1",
  token: "a".repeat(43),
  guestNames: ["Ana", "Luis"],
  rsvpStatus: "PENDING" as const,
  rsvpAttendeesCount: null,
  hasActivity: false,
};

describe("toAdminInvitationView", () => {
  it("builds the personal link from the public base URL", () => {
    expect(toAdminInvitationView(base, "https://example.vercel.app").link).toBe(
      `https://example.vercel.app/i/${"a".repeat(43)}`,
    );
  });

  it.each([
    [{ rsvpStatus: "PENDING" as const }, "Sin respuesta"],
    [{ rsvpStatus: "ATTENDING" as const, rsvpAttendeesCount: 2 }, "Asiste (2)"],
    [
      { rsvpStatus: "NOT_ATTENDING" as const, rsvpAttendeesCount: 0 },
      "No asiste",
    ],
  ])("labels the RSVP %#", (overrides, label) => {
    expect(
      toAdminInvitationView({ ...base, ...overrides }, "https://x").rsvpLabel,
    ).toBe(label);
  });

  it("only allows deleting invitations without activity", () => {
    expect(toAdminInvitationView(base, "https://x").canDelete).toBe(true);
    expect(
      toAdminInvitationView({ ...base, hasActivity: true }, "https://x")
        .canDelete,
    ).toBe(false);
  });
});
