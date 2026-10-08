import { describe, expect, it } from "vitest";
import { EVENT_TIME_ZONE, zonedDateTimeToUtc } from "@/lib/time-zone";
import { isRsvpOpen, rsvpClosesAt } from "@/modules/rsvp/domain/rsvp-rules";

const eventStart = zonedDateTimeToUtc("2030-11-09", "16:30", EVENT_TIME_ZONE);
const at = (date: string, time: string) =>
  zonedDateTimeToUtc(date, time, EVENT_TIME_ZONE);

describe("RSVP deadline (until the event starts)", () => {
  it("closes when the event starts", () => {
    expect(rsvpClosesAt(eventStart).toISOString()).toBe(
      "2030-11-09T19:30:00.000Z",
    );
  });

  it("is open on the event day until the start time", () => {
    expect(isRsvpOpen(eventStart, at("2030-11-09", "16:29"))).toBe(true);
  });

  it("is closed at the start time and afterwards", () => {
    expect(isRsvpOpen(eventStart, at("2030-11-09", "16:30"))).toBe(false);
    expect(isRsvpOpen(eventStart, at("2030-11-10", "12:00"))).toBe(false);
  });
});
