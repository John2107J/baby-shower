import type { PrismaClient } from "@/generated/prisma/client";
import type { RsvpAnswer } from "@/modules/rsvp/schemas/rsvp-form";

export class RsvpInvitationNotFoundError extends Error {
  constructor() {
    super("Invitation not found");
    this.name = "RsvpInvitationNotFoundError";
  }
}

export class RsvpClosedError extends Error {
  constructor() {
    super("RSVP closed");
    this.name = "RsvpClosedError";
  }
}

/**
 * Saves the answer while holding the invitation's row lock, so concurrent
 * submissions (double click, two devices) apply one after the other and the
 * deadline check and the write see the same state.
 */
export async function saveRsvp(
  db: PrismaClient,
  token: string,
  answer: RsvpAnswer,
  isOpen: () => boolean,
  now: Date,
): Promise<void> {
  await db.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<{ id: string }[]>`
      SELECT "id" FROM "Invitation" WHERE "token" = ${token} FOR UPDATE`;
    const invitation = rows[0];
    if (!invitation) throw new RsvpInvitationNotFoundError();
    if (!isOpen()) throw new RsvpClosedError();
    await tx.invitation.update({
      where: { id: invitation.id },
      data: {
        rsvpStatus: answer.attending ? "ATTENDING" : "NOT_ATTENDING",
        rsvpAttendeesCount: answer.attendees,
        rsvpUpdatedAt: now,
      },
    });
  });
}
