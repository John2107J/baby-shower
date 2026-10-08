import { z } from "zod";
import { Prisma, type PrismaClient } from "@/generated/prisma/client";
import { generateInvitationToken } from "@/modules/invitation/domain/invitation-rules";
import {
  type AdminInvitationRecord,
  InvitationHasActivityError,
  InvitationNotFoundError,
  createInvitation,
  deleteInvitationWithoutActivity,
  findInvitation,
  listInvitations,
  replaceInvitationToken,
  updateInvitationNames,
} from "@/modules/invitation/repositories/invitation-repository";
import { guestNamesSchema } from "@/modules/invitation/schemas/invitation-form";

export type SaveInvitationResult =
  | { ok: true; id: string }
  | { ok: false; reason: "invalid"; error: string }
  | { ok: false; reason: "not_found" };

export type DeleteInvitationResult =
  { ok: true } | { ok: false; reason: "not_found" | "has_activity" };

const UNIQUE_VIOLATION = "P2002";
const MAX_TOKEN_ATTEMPTS = 3;

const idSchema = z.uuid();
const isValidId = (id: string) => idSchema.safeParse(id).success;

function parseNames(rawNames: string[]) {
  const parsed = guestNamesSchema.safeParse(rawNames);
  return parsed.success
    ? { names: parsed.data, error: null }
    : {
        names: null,
        error: parsed.error.issues[0]?.message ?? "Revisá los nombres.",
      };
}

function isTokenCollision(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === UNIQUE_VIOLATION
  );
}

/** A 256-bit collision is practically impossible; retrying keeps it impossible to surface. */
async function withFreshToken<T>(
  run: (token: string) => Promise<T>,
): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await run(generateInvitationToken());
    } catch (error) {
      if (!isTokenCollision(error) || attempt >= MAX_TOKEN_ATTEMPTS)
        throw error;
    }
  }
}

export function getInvitations(
  db: PrismaClient,
): Promise<AdminInvitationRecord[]> {
  return listInvitations(db);
}

export function getInvitation(
  db: PrismaClient,
  id: string,
): Promise<AdminInvitationRecord | null> {
  return isValidId(id) ? findInvitation(db, id) : Promise.resolve(null);
}

export async function createInvitationFromForm(
  db: PrismaClient,
  rawNames: string[],
): Promise<SaveInvitationResult> {
  const { names, error } = parseNames(rawNames);
  if (!names) return { ok: false, reason: "invalid", error };
  const id = await withFreshToken((token) =>
    createInvitation(db, names, token),
  );
  return { ok: true, id };
}

export async function updateInvitationFromForm(
  db: PrismaClient,
  id: string,
  rawNames: string[],
): Promise<SaveInvitationResult> {
  if (!isValidId(id)) return { ok: false, reason: "not_found" };
  const { names, error } = parseNames(rawNames);
  if (!names) return { ok: false, reason: "invalid", error };
  try {
    await updateInvitationNames(db, id, names);
    return { ok: true, id };
  } catch (caught) {
    if (caught instanceof InvitationNotFoundError)
      return { ok: false, reason: "not_found" };
    throw caught;
  }
}

/** Issues a new link; the previous one stops working immediately (decision 23). */
export async function regenerateInvitationLink(
  db: PrismaClient,
  id: string,
): Promise<boolean> {
  if (!isValidId(id)) return false;
  return withFreshToken((token) => replaceInvitationToken(db, id, token));
}

export async function deleteInvitation(
  db: PrismaClient,
  id: string,
): Promise<DeleteInvitationResult> {
  if (!isValidId(id)) return { ok: false, reason: "not_found" };
  try {
    await deleteInvitationWithoutActivity(db, id);
    return { ok: true };
  } catch (error) {
    if (error instanceof InvitationNotFoundError)
      return { ok: false, reason: "not_found" };
    if (error instanceof InvitationHasActivityError)
      return { ok: false, reason: "has_activity" };
    throw error;
  }
}
