"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { logger } from "@/lib/logger";
import { ADMIN_ROUTES } from "@/lib/routes";
import { requireAdmin } from "@/modules/auth/services/require-admin";
import { readGuestNames } from "@/modules/invitation/schemas/invitation-form";
import {
  type SaveInvitationResult,
  createInvitationFromForm,
  deleteInvitation,
  regenerateInvitationLink,
  updateInvitationFromForm,
  markInvitationAsSent,
} from "@/modules/invitation/services/invitation-service";

// Submitted names travel back so React's form reset does not wipe them.
export type InvitationFormState =
  | { status: "idle" }
  | { status: "invalid"; names: string[]; error: string }
  | { status: "error"; names: string[] }
  | { status: "not_found" };

export type InvitationRowState =
  { status: "idle" } | { status: "has_activity" } | { status: "error" };

async function runSave(
  formData: FormData,
  save: (names: string[]) => Promise<SaveInvitationResult>,
): Promise<InvitationFormState> {
  await requireAdmin();
  const names = readGuestNames(formData);
  let result: SaveInvitationResult;
  try {
    result = await save(names);
  } catch (error) {
    logger.error("invitation save failed", {
      errorName: error instanceof Error ? error.name : "unknown",
    });
    return { status: "error", names };
  }
  if (!result.ok) {
    return result.reason === "not_found"
      ? { status: "not_found" }
      : { status: "invalid", names, error: result.error };
  }
  revalidatePath(ADMIN_ROUTES.invitations);
  redirect(ADMIN_ROUTES.invitations);
}

export async function createInvitationAction(
  _previousState: InvitationFormState,
  formData: FormData,
): Promise<InvitationFormState> {
  return runSave(formData, (names) => createInvitationFromForm(getDb(), names));
}

export async function updateInvitationAction(
  invitationId: string,
  _previousState: InvitationFormState,
  formData: FormData,
): Promise<InvitationFormState> {
  return runSave(formData, (names) =>
    updateInvitationFromForm(getDb(), invitationId, names),
  );
}

export async function regenerateInvitationLinkAction(
  invitationId: string,
): Promise<void> {
  await requireAdmin();
  await regenerateInvitationLink(getDb(), invitationId);
  revalidatePath(ADMIN_ROUTES.invitations);
}

export async function markInvitationSentAction(
  invitationId: string,
  via: string,
): Promise<void> {
  await requireAdmin();
  try {
    await markInvitationAsSent(getDb(), invitationId, via);
  } catch (error) {
    // Only a convenience mark: the message was already opened, so nothing is shown.
    logger.error("invitation sent mark failed", {
      errorName: error instanceof Error ? error.name : "unknown",
    });
    return;
  }
  revalidatePath(ADMIN_ROUTES.invitations);
}

export async function deleteInvitationAction(
  invitationId: string,
  _previousState: InvitationRowState,
): Promise<InvitationRowState> {
  await requireAdmin();
  try {
    const result = await deleteInvitation(getDb(), invitationId);
    if (!result.ok && result.reason === "has_activity")
      return { status: "has_activity" };
  } catch (error) {
    logger.error("invitation delete failed", {
      errorName: error instanceof Error ? error.name : "unknown",
    });
    return { status: "error" };
  }
  revalidatePath(ADMIN_ROUTES.invitations);
  return { status: "idle" };
}
