import type { RsvpStatus } from "@/generated/prisma/client";

export type RsvpRow = {
  id: string;
  guestNames: string[];
  rsvpStatus: RsvpStatus;
  rsvpAttendeesCount: number | null;
  rsvpUpdatedAt: Date | null;
  createdAt: Date;
};

/** Decision 35: what the parents see at the top of "Confirmaciones". */
export type RsvpSummary = {
  attending: { people: number; invitations: number };
  notAttending: { invitations: number; names: number };
  pending: { invitations: number; names: number };
};

// Pending first so the parents see whom to remind; then yes, then no.
const STATUS_ORDER: Record<RsvpStatus, number> = {
  PENDING: 0,
  ATTENDING: 1,
  NOT_ATTENDING: 2,
};

export function summarizeRsvps(rows: readonly RsvpRow[]): RsvpSummary {
  const summary: RsvpSummary = {
    attending: { people: 0, invitations: 0 },
    notAttending: { invitations: 0, names: 0 },
    pending: { invitations: 0, names: 0 },
  };
  for (const row of rows) {
    if (row.rsvpStatus === "ATTENDING") {
      summary.attending.invitations += 1;
      summary.attending.people += row.rsvpAttendeesCount ?? 0;
    } else if (row.rsvpStatus === "NOT_ATTENDING") {
      summary.notAttending.invitations += 1;
      summary.notAttending.names += row.guestNames.length;
    } else {
      summary.pending.invitations += 1;
      summary.pending.names += row.guestNames.length;
    }
  }
  return summary;
}

export function sortForFollowUp<T extends RsvpRow>(rows: readonly T[]): T[] {
  return [...rows].sort(
    (a, b) =>
      STATUS_ORDER[a.rsvpStatus] - STATUS_ORDER[b.rsvpStatus] ||
      a.createdAt.getTime() - b.createdAt.getTime(),
  );
}
