import { describe, expect, it } from "vitest";
import { EVENT_TIME_ZONE, zonedDateTimeToUtc } from "@/lib/time-zone";
import { toGuestInvitationView } from "@/modules/invitation/dto/guest-invitation-dto";

const event = {
  babyName: "Bebé de Prueba",
  startsAt: zonedDateTimeToUtc("2030-11-09", "16:30", EVENT_TIME_ZONE),
  venueName: "Salón de Prueba",
  streetAddress: "Calle Falsa 123",
  city: "Ciudad de Prueba",
  mapsUrl: "https://maps.app.goo.gl/example",
  paymentAlias: "alias.secreto",
  paymentCbu: "2850590940090418135201",
  paymentHolderName: "Titular Secreto",
};
const invitation = {
  guestNames: ["Ana", "Luis", "Sofía"],
  rsvpStatus: "PENDING" as const,
  rsvpAttendeesCount: null,
};
const BEFORE_DEADLINE = zonedDateTimeToUtc(
  "2030-11-01",
  "10:00",
  EVENT_TIME_ZONE,
);

describe("toGuestInvitationView", () => {
  it("formats names and the date for Argentina", () => {
    const view = toGuestInvitationView(invitation, event, BEFORE_DEADLINE);
    expect(view).toMatchObject({
      guestNamesLabel: "Ana, Luis y Sofía",
      weekday: "Sábado",
      dayOfMonth: "9",
      month: "NOVIEMBRE",
      time: "16:30",
      rsvp: { status: "pending" },
      rsvpOpen: true,
      rsvpDeadlineLabel: "sábado 9 de noviembre a las 16:30",
      maxAttendees: 6,
    });
  });

  it("exposes exactly the public fields: no payment data, ids or tokens (CLAUDE.md §3.5)", () => {
    const view = toGuestInvitationView(invitation, event, BEFORE_DEADLINE);
    expect(Object.keys(view).sort()).toEqual(
      [
        "babyName",
        "city",
        "dayOfMonth",
        "guestNamesLabel",
        "mapsUrl",
        "maxAttendees",
        "month",
        "rsvp",
        "rsvpDeadlineLabel",
        "rsvpOpen",
        "streetAddress",
        "time",
        "venueName",
        "weekday",
      ].sort(),
    );
    const serialized = JSON.stringify(view);
    for (const secret of [
      "alias.secreto",
      "2850590940090418135201",
      "Titular Secreto",
    ]) {
      expect(serialized).not.toContain(secret);
    }
  });

  it("maps each RSVP state", () => {
    expect(
      toGuestInvitationView(
        { ...invitation, rsvpStatus: "ATTENDING", rsvpAttendeesCount: 4 },
        event,
      ).rsvp,
    ).toEqual({
      status: "attending",
      attendees: 4,
    });
    expect(
      toGuestInvitationView(
        { ...invitation, rsvpStatus: "NOT_ATTENDING", rsvpAttendeesCount: 0 },
        event,
      ).rsvp,
    ).toEqual({
      status: "not_attending",
    });
  });

  it("keeps the RSVP open on the event day until the event starts", () => {
    const at = (time: string) =>
      zonedDateTimeToUtc("2030-11-09", time, EVENT_TIME_ZONE);
    expect(toGuestInvitationView(invitation, event, at("16:29")).rsvpOpen).toBe(
      true,
    );
    expect(toGuestInvitationView(invitation, event, at("16:30")).rsvpOpen).toBe(
      false,
    );
  });
});
