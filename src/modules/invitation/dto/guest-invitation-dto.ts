import { EVENT_TIME_ZONE } from "@/lib/time-zone";
import type { EventRecord } from "@/modules/event/repositories/event-repository";
import type { GuestInvitationRecord } from "@/modules/invitation/repositories/guest-invitation-repository";
import {
  MAX_ATTENDEES,
  isRsvpOpen,
  rsvpClosesAt,
} from "@/modules/rsvp/domain/rsvp-rules";

export type GuestRsvp =
  | { status: "pending" }
  | { status: "attending"; attendees: number }
  | { status: "not_attending" };

/**
 * Public view of an invitation. Built field by field on purpose: payment data,
 * ids, tokens and anything about other guests never reach the browser
 * (CLAUDE.md §3.5). A test checks the exact set of keys.
 */
export type GuestInvitationView = {
  guestNamesLabel: string;
  babyName: string;
  weekday: string;
  dayOfMonth: string;
  month: string;
  time: string;
  venueName: string | null;
  streetAddress: string;
  city: string;
  mapsUrl: string | null;
  rsvp: GuestRsvp;
  rsvpOpen: boolean;
  rsvpDeadlineLabel: string;
  maxAttendees: number;
};

const capitalize = (text: string) =>
  text.charAt(0).toUpperCase() + text.slice(1);

function part(date: Date, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: EVENT_TIME_ZONE,
    ...options,
  }).format(date);
}

function toGuestRsvp(invitation: GuestInvitationRecord): GuestRsvp {
  if (invitation.rsvpStatus === "ATTENDING") {
    return {
      status: "attending",
      attendees: invitation.rsvpAttendeesCount ?? 1,
    };
  }
  return invitation.rsvpStatus === "NOT_ATTENDING"
    ? { status: "not_attending" }
    : { status: "pending" };
}

export function toGuestInvitationView(
  invitation: GuestInvitationRecord,
  event: EventRecord,
  now: Date = new Date(),
): GuestInvitationView {
  const lastDay = new Date(rsvpClosesAt(event.startsAt).getTime() - 1);
  return {
    guestNamesLabel: new Intl.ListFormat("es", {
      style: "long",
      type: "conjunction",
    }).format(invitation.guestNames),
    babyName: event.babyName,
    weekday: capitalize(part(event.startsAt, { weekday: "long" })),
    dayOfMonth: part(event.startsAt, { day: "numeric" }),
    month: part(event.startsAt, { month: "long" }).toUpperCase(),
    time: part(event.startsAt, {
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }),
    venueName: event.venueName,
    streetAddress: event.streetAddress,
    city: event.city,
    mapsUrl: event.mapsUrl,
    rsvp: toGuestRsvp(invitation),
    rsvpOpen: isRsvpOpen(event.startsAt, now),
    rsvpDeadlineLabel: `${part(lastDay, { weekday: "long" })} ${part(lastDay, { day: "numeric" })} de ${part(lastDay, { month: "long" })}`,
    maxAttendees: MAX_ATTENDEES,
  };
}
