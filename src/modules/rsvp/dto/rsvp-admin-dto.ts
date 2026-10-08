import { EVENT_TIME_ZONE } from "@/lib/time-zone";
import type { RsvpRow } from "@/modules/rsvp/domain/rsvp-summary";

export type RsvpListItem = {
  id: string;
  names: string;
  statusLabel: string;
  status: "pending" | "attending" | "not_attending";
  answeredAt: string | null;
};

const answeredAtFormat = new Intl.DateTimeFormat("es-AR", {
  timeZone: EVENT_TIME_ZONE,
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

export function toRsvpListItem(row: RsvpRow): RsvpListItem {
  const names = row.guestNames.join(", ");
  const answeredAt = row.rsvpUpdatedAt
    ? answeredAtFormat.format(row.rsvpUpdatedAt)
    : null;
  if (row.rsvpStatus === "ATTENDING") {
    const people = row.rsvpAttendeesCount ?? 0;
    return {
      id: row.id,
      names,
      status: "attending",
      statusLabel: `Vienen ${people} ${people === 1 ? "persona" : "personas"}`,
      answeredAt,
    };
  }
  if (row.rsvpStatus === "NOT_ATTENDING") {
    return {
      id: row.id,
      names,
      status: "not_attending",
      statusLabel: "No vienen",
      answeredAt,
    };
  }
  return {
    id: row.id,
    names,
    status: "pending",
    statusLabel: "Falta responder",
    answeredAt: null,
  };
}
