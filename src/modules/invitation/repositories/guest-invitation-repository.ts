import type { PrismaClient, RsvpStatus } from "@/generated/prisma/client";

/** Exactly what a guest may see about their own invitation; nothing about other guests. */
export type GuestInvitationRecord = {
  guestNames: string[];
  rsvpStatus: RsvpStatus;
  rsvpAttendeesCount: number | null;
};

export function findInvitationByToken(
  db: PrismaClient,
  token: string,
): Promise<GuestInvitationRecord | null> {
  return db.invitation.findUnique({
    where: { token },
    select: { guestNames: true, rsvpStatus: true, rsvpAttendeesCount: true },
  });
}
