import type { PrismaClient, RsvpStatus } from "@/generated/prisma/client";

export type AdminInvitationRecord = {
  id: string;
  token: string;
  guestNames: string[];
  rsvpStatus: RsvpStatus;
  rsvpAttendeesCount: number | null;
  hasActivity: boolean;
};

export class InvitationNotFoundError extends Error {
  constructor() {
    super("Invitation not found");
    this.name = "InvitationNotFoundError";
  }
}

export class InvitationHasActivityError extends Error {
  constructor() {
    super("Invitation has RSVP, claims or contributions");
    this.name = "InvitationHasActivityError";
  }
}

const INVITATION_SELECT = {
  id: true,
  token: true,
  guestNames: true,
  rsvpStatus: true,
  rsvpAttendeesCount: true,
  _count: { select: { claims: true, contributions: true } },
} as const;

type InvitationRow = {
  id: string;
  token: string;
  guestNames: string[];
  rsvpStatus: RsvpStatus;
  rsvpAttendeesCount: number | null;
  _count: { claims: number; contributions: number };
};

function toRecord({ _count, ...row }: InvitationRow): AdminInvitationRecord {
  return {
    ...row,
    hasActivity:
      row.rsvpStatus !== "PENDING" ||
      _count.claims > 0 ||
      _count.contributions > 0,
  };
}

export async function listInvitations(
  db: PrismaClient,
): Promise<AdminInvitationRecord[]> {
  const rows = await db.invitation.findMany({
    select: INVITATION_SELECT,
    orderBy: { createdAt: "asc" },
  });
  return rows.map(toRecord);
}

export async function findInvitation(
  db: PrismaClient,
  id: string,
): Promise<AdminInvitationRecord | null> {
  const row = await db.invitation.findUnique({
    where: { id },
    select: INVITATION_SELECT,
  });
  return row ? toRecord(row) : null;
}

export async function createInvitation(
  db: PrismaClient,
  guestNames: string[],
  token: string,
): Promise<string> {
  const row = await db.invitation.create({
    data: { guestNames, token },
    select: { id: true },
  });
  return row.id;
}

/** Names can change freely; the link stays the same (decision 23). */
export async function updateInvitationNames(
  db: PrismaClient,
  id: string,
  guestNames: string[],
): Promise<void> {
  const result = await db.invitation.updateMany({
    where: { id },
    data: { guestNames },
  });
  if (result.count === 0) throw new InvitationNotFoundError();
}

export async function replaceInvitationToken(
  db: PrismaClient,
  id: string,
  token: string,
): Promise<boolean> {
  const result = await db.invitation.updateMany({
    where: { id },
    data: { token },
  });
  return result.count === 1;
}

/** Deletes only invitations without RSVP, claims or contributions (decision 23). */
export async function deleteInvitationWithoutActivity(
  db: PrismaClient,
  id: string,
): Promise<void> {
  await db.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<{ rsvpStatus: RsvpStatus }[]>`
      SELECT "rsvpStatus" FROM "Invitation" WHERE "id" = ${id}::uuid FOR UPDATE`;
    const current = rows[0];
    if (!current) throw new InvitationNotFoundError();
    const [claims, contributions] = await Promise.all([
      tx.giftClaim.count({ where: { invitationId: id } }),
      tx.contribution.count({ where: { invitationId: id } }),
    ]);
    if (current.rsvpStatus !== "PENDING" || claims > 0 || contributions > 0) {
      throw new InvitationHasActivityError();
    }
    await tx.invitation.delete({ where: { id } });
  });
}
