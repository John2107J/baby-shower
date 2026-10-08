import { describe, expect, it } from "vitest";
import { EVENT_TIME_ZONE, zonedDateTimeToUtc } from "@/lib/time-zone";
import { isRsvpOpen, rsvpClosesAt } from "@/modules/rsvp/domain/rsvp-rules";

const eventStart = zonedDateTimeToUtc("2030-11-09", "16:30", EVENT_TIME_ZONE);
const at = (date: string, time: string) =>
  zonedDateTimeToUtc(date, time, EVENT_TIME_ZONE);

describe("RSVP deadline (until 23:59 of the day before, Argentina time)", () => {
  it("closes at midnight of the event day in Buenos Aires", () => {
    expect(rsvpClosesAt(eventStart).toISOString()).toBe(
      "2030-11-09T03:00:00.000Z",
    );
  });

  it("is open the day before at 23:59", () => {
    expect(isRsvpOpen(eventStart, at("2030-11-08", "23:59"))).toBe(true);
  });

  it("is closed at 00:00 of the event day and afterwards", () => {
    expect(isRsvpOpen(eventStart, at("2030-11-09", "00:00"))).toBe(false);
    expect(isRsvpOpen(eventStart, at("2030-11-10", "12:00"))).toBe(false);
  });
});
