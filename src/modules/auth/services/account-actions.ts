"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { getClientIp } from "@/lib/client-ip";
import { getDb } from "@/lib/db";
import { logger } from "@/lib/logger";
import { ADMIN_ROUTES } from "@/lib/routes";
import {
  parseChangePasswordForm,
  parseCurrentPassword,
  parseRecoveryForm,
  parseSetupForm,
} from "@/modules/auth/schemas/account-forms";
import {
  changePassword,
  createFirstAccount,
  recoverPassword,
  regenerateRecoveryCodes,
} from "@/modules/auth/services/account-service";
import { requireAdmin } from "@/modules/auth/services/require-admin";

type FailureReason<T> = T extends { ok: false; reason: infer R } ? R : never;

/** The email travels back so React's form reset does not wipe it; passwords never do. */
export type SetupAccountState =
  | { status: "idle" }
  | { status: "created"; recoveryCodes: string[] }
  | {
      status:
        FailureReason<Awaited<ReturnType<typeof createFirstAccount>>> | "error";
      email: string;
    };

export type RecoverPasswordState =
  | { status: "idle" | "done" }
  | {
      status:
        FailureReason<Awaited<ReturnType<typeof recoverPassword>>> | "error";
      email: string;
    };

export type ChangePasswordState =
  | { status: "idle" | "done" }
  | {
      status:
        FailureReason<Awaited<ReturnType<typeof changePassword>>> | "error";
    };

export type RecoveryCodesState =
  | { status: "idle" }
  | { status: "generated"; recoveryCodes: string[] }
  | {
      status:
        | FailureReason<Awaited<ReturnType<typeof regenerateRecoveryCodes>>>
        | "error";
    };

const submittedEmail = (formData: FormData) => {
  const value = formData.get("email");
  return typeof value === "string" ? value.slice(0, 254) : "";
};

function logFailure(action: string, error: unknown) {
  logger.error(`${action} failed`, {
    errorName: error instanceof Error ? error.name : "unknown",
  });
}

/** Public on purpose: it only works while no account exists and with the setup code. */
export async function setupAccountAction(
  _previousState: SetupAccountState,
  formData: FormData,
): Promise<SetupAccountState> {
  const email = submittedEmail(formData);
  try {
    const result = await createFirstAccount(
      getDb(),
      parseSetupForm(formData),
      process.env["ADMIN_SETUP_CODE"],
      getClientIp(await headers()),
    );
    if (!result.ok) return { status: result.reason, email };
    return { status: "created", recoveryCodes: result.recoveryCodes };
  } catch (error) {
    logFailure("account setup", error);
    return { status: "error", email };
  }
}

export async function recoverPasswordAction(
  _previousState: RecoverPasswordState,
  formData: FormData,
): Promise<RecoverPasswordState> {
  const email = submittedEmail(formData);
  try {
    const result = await recoverPassword(
      getDb(),
      parseRecoveryForm(formData),
      getClientIp(await headers()),
    );
    return result.ok ? { status: "done" } : { status: result.reason, email };
  } catch (error) {
    logFailure("password recovery", error);
    return { status: "error", email };
  }
}

export async function changePasswordAction(
  _previousState: ChangePasswordState,
  formData: FormData,
): Promise<ChangePasswordState> {
  const admin = await requireAdmin();
  try {
    const result = await changePassword(
      getDb(),
      admin.id,
      parseChangePasswordForm(formData),
    );
    return result.ok ? { status: "done" } : { status: result.reason };
  } catch (error) {
    logFailure("password change", error);
    return { status: "error" };
  }
}

export async function regenerateRecoveryCodesAction(
  _previousState: RecoveryCodesState,
  formData: FormData,
): Promise<RecoveryCodesState> {
  const admin = await requireAdmin();
  try {
    const result = await regenerateRecoveryCodes(
      getDb(),
      admin.id,
      parseCurrentPassword(formData),
    );
    if (!result.ok) return { status: result.reason };
    revalidatePath(ADMIN_ROUTES.account);
    return { status: "generated", recoveryCodes: result.recoveryCodes };
  } catch (error) {
    logFailure("recovery codes", error);
    return { status: "error" };
  }
}
