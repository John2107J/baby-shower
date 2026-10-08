"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { logger } from "@/lib/logger";
import { ADMIN_ROUTES } from "@/lib/routes";
import { requireAdmin } from "@/modules/auth/services/require-admin";
import { parseAdminAmount } from "@/modules/contribution/schemas/contribution-admin-form";
import {
  type AdminChangeResult,
  confirmContributionById,
  editContributionAmount,
  voidClaimById,
  voidContributionById,
} from "@/modules/contribution/services/contribution-admin-service";

export type AdminChangeState =
  { status: "idle" } | AdminChangeResult | { status: "error" };

async function runAdminChange(
  change: () => Promise<AdminChangeResult>,
): Promise<AdminChangeState> {
  // Server actions are public endpoints: authorization is checked here, not only in the layout.
  await requireAdmin();
  try {
    const result = await change();
    revalidatePath(ADMIN_ROUTES.contributions);
    return result;
  } catch (error) {
    logger.error("contribution admin change failed", {
      errorName: error instanceof Error ? error.name : "unknown",
    });
    return { status: "error" };
  }
}

export async function confirmContributionAction(
  contributionId: string,
): Promise<AdminChangeState> {
  return runAdminChange(() => confirmContributionById(getDb(), contributionId));
}

export async function voidContributionAction(
  contributionId: string,
): Promise<AdminChangeState> {
  return runAdminChange(() => voidContributionById(getDb(), contributionId));
}

export async function voidClaimAction(
  claimId: string,
): Promise<AdminChangeState> {
  return runAdminChange(() => voidClaimById(getDb(), claimId));
}

export async function editContributionAmountAction(
  contributionId: string,
  _previousState: AdminChangeState,
  formData: FormData,
): Promise<AdminChangeState> {
  return runAdminChange(() =>
    editContributionAmount(getDb(), contributionId, parseAdminAmount(formData)),
  );
}
