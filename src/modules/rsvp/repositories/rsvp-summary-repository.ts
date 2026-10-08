import type { PrismaClient } from "@/generated/prisma/client";
import type { RsvpRow } from "@/modules/rsvp/domain/rsvp-summary";

export function listRsvpRows(db: PrismaClient): Promise<RsvpRow[]> {
  return db.invitation.findMany({
    select: {
      id: true,
      guestNames: true,
      rsvpStatus: true,
      rsvpAttendeesCount: true,
      rsvpUpdatedAt: true,
      createdAt: true,
    },
  });
}
