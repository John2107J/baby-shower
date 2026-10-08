import { describe, expect, it } from "vitest";
import {
  EVENT_TIME_ZONE,
  utcToZonedDateTime,
  zonedDateTimeToUtc,
} from "@/lib/time-zone";

describe("zonedDateTimeToUtc", () => {
  it("converts Buenos Aires wall-clock time (UTC-3) to UTC", () => {
    expect(
      zonedDateTimeToUtc("2026-11-07", "16:30", EVENT_TIME_ZONE).toISOString(),
    ).toBe("2026-11-07T19:30:00.000Z");
  });

  it("handles times that cross midnight in UTC", () => {
    expect(
      zonedDateTimeToUtc("2026-11-07", "22:15", EVENT_TIME_ZONE).toISOString(),
    ).toBe("2026-11-08T01:15:00.000Z");
  });

  it("works for zones with daylight saving time", () => {
    expect(
      zonedDateTimeToUtc("2026-07-01", "12:00", "Europe/Madrid").toISOString(),
    ).toBe("2026-07-01T10:00:00.000Z");
    expect(
      zonedDateTimeToUtc("2026-01-15", "12:00", "Europe/Madrid").toISOString(),
    ).toBe("2026-01-15T11:00:00.000Z");
  });
});

describe("utcToZonedDateTime", () => {
  it("is the inverse of zonedDateTimeToUtc", () => {
    const instant = zonedDateTimeToUtc("2026-11-07", "16:30", EVENT_TIME_ZONE);
    expect(utcToZonedDateTime(instant, EVENT_TIME_ZONE)).toEqual({
      date: "2026-11-07",
      time: "16:30",
    });
  });

  it("uses 24-hour time with midnight as 00", () => {
    expect(
      utcToZonedDateTime(new Date("2026-11-08T03:05:00Z"), EVENT_TIME_ZONE),
    ).toEqual({
      date: "2026-11-08",
      time: "00:05",
    });
  });
});
