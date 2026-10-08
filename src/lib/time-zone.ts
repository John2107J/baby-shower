/** Every date shown to people is in Argentina's time zone (CLAUDE.md §5.2). */
export const EVENT_TIME_ZONE = "America/Argentina/Buenos_Aires";

const MS_PER_MINUTE = 60_000;
const OFFSET_PATTERN = /^GMT(?:([+-])(\d{2}):(\d{2}))?$/;

/** Offset of `timeZone` from UTC at `instant`, in milliseconds (e.g. -3h for Buenos Aires). */
function getTimeZoneOffsetMs(timeZone: string, instant: Date): number {
  const label = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "longOffset",
  })
    .formatToParts(instant)
    .find((part) => part.type === "timeZoneName")?.value;
  const match = label ? OFFSET_PATTERN.exec(label) : null;
  if (!match) throw new Error(`Unable to resolve UTC offset for ${timeZone}`);
  const [, sign, hours, minutes] = match;
  if (!sign) return 0;
  const offsetMinutes = Number(hours) * 60 + Number(minutes);
  return (sign === "-" ? -1 : 1) * offsetMinutes * MS_PER_MINUTE;
}

/**
 * Converts a wall-clock date ("YYYY-MM-DD") and time ("HH:mm") in `timeZone`
 * into the UTC instant to store.
 */
export function zonedDateTimeToUtc(
  date: string,
  time: string,
  timeZone: string,
): Date {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const wallClockAsUtc = Date.UTC(year!, month! - 1, day!, hour!, minute!);
  const firstGuess =
    wallClockAsUtc - getTimeZoneOffsetMs(timeZone, new Date(wallClockAsUtc));
  // Recompute with the offset at the guessed instant in case a DST change sits in between.
  return new Date(
    wallClockAsUtc - getTimeZoneOffsetMs(timeZone, new Date(firstGuess)),
  );
}

/** Splits a UTC instant into wall-clock date ("YYYY-MM-DD") and time ("HH:mm") in `timeZone`. */
export function utcToZonedDateTime(
  instant: Date,
  timeZone: string,
): { date: string; time: string } {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(instant)
      .map((part) => [part.type, part.value]),
  );
  return {
    date: `${parts["year"]}-${parts["month"]}-${parts["day"]}`,
    time: `${parts["hour"]}:${parts["minute"]}`,
  };
}
