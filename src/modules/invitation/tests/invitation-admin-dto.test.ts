import { describe, expect, it } from "vitest";
import { toAdminInvitationView } from "@/modules/invitation/dto/invitation-admin-dto";

const base = {
  id: "i1",
  token: "a".repeat(43),
  guestNames: ["Ana", "Luis"],
  rsvpStatus: "PENDING" as const,
  rsvpAttendeesCount: null,
  sentVia: null,
  hasActivity: false,
};

describe("toAdminInvitationView", () => {
  it("builds the personal link from the public base URL", () => {
    expect(
      toAdminInvitationView(base, "https://example.vercel.app", null).link,
    ).toBe(`https://example.vercel.app/i/${"a".repeat(43)}`);
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
      toAdminInvitationView({ ...base, ...overrides }, "https://x", null)
        .rsvpLabel,
    ).toBe(label);
  });

  it("only allows deleting invitations without activity", () => {
    expect(toAdminInvitationView(base, "https://x", null).canDelete).toBe(true);
    expect(
      toAdminInvitationView({ ...base, hasActivity: true }, "https://x", null)
        .canDelete,
    ).toBe(false);
  });

  it("marks invitations already sent", () => {
    expect(toAdminInvitationView(base, "https://x", null).sentLabel).toBeNull();
    expect(
      toAdminInvitationView({ ...base, sentVia: "WHATSAPP" }, "https://x", null)
        .sentLabel,
    ).toBe("Enviada por WhatsApp");
    expect(
      toAdminInvitationView({ ...base, sentVia: "EMAIL" }, "https://x", null)
        .sentLabel,
    ).toBe("Enviada por mail");
  });

  it("builds share links with this invitation's own link, once the event has data", () => {
    expect(toAdminInvitationView(base, "https://x", null).share).toBeNull();
    const view = toAdminInvitationView(base, "https://x", "Bebé de Prueba");
    for (const url of Object.values(view.share!)) {
      expect(decodeURIComponent(url.replaceAll("+", " "))).toContain(view.link);
    }
  });
});
