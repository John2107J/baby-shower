"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { getClientIp } from "@/lib/client-ip";
import { getDb } from "@/lib/db";
import { logger } from "@/lib/logger";
import { GUEST_ROUTES } from "@/lib/routes";
import {
  parseClaimForm,
  parseContributionForm,
} from "@/modules/contribution/schemas/gift-list-forms";
import {
  type ClaimResult,
  type ContributionResult,
  claimGiftForGuest,
  declareContributionForGuest,
} from "@/modules/contribution/services/gift-list-service";

type FailureReason<T> = T extends { ok: false; reason: infer R } ? R : never;

export type GiftActionState =
  | { status: "idle" }
  | { status: "saved"; giftId: string; savedAt: number }
  | {
      status:
        | FailureReason<ClaimResult>
        | FailureReason<ContributionResult>
        | "error";
      giftId: string | null;
    };

const submittedGiftId = (formData: FormData) => {
  const value = formData.get("giftId");
  return typeof value === "string" ? value : null;
};

async function runGuestAction(
  token: string,
  formData: FormData,
  run: (clientIp: string) => Promise<ClaimResult | ContributionResult>,
): Promise<GiftActionState> {
  const giftId = submittedGiftId(formData);
  try {
    const result = await run(getClientIp(await headers()));
    // Refreshed after rejections too: the guest then sees the current totals and limits.
    if (result.ok || result.reason !== "not_found")
      revalidatePath(GUEST_ROUTES.gifts(token));
    if (!result.ok) return { status: result.reason, giftId };
    return { status: "saved", giftId: giftId ?? "", savedAt: Date.now() };
  } catch (error) {
    logger.error("gift list action failed", {
      errorName: error instanceof Error ? error.name : "unknown",
    });
    return { status: "error", giftId };
  }
}

/** Public action: the invitation token is the only credential (CLAUDE.md §3.2). */
export async function claimGiftAction(
  token: string,
  _previousState: GiftActionState,
  formData: FormData,
): Promise<GiftActionState> {
  return runGuestAction(token, formData, (clientIp) =>
    claimGiftForGuest(getDb(), token, parseClaimForm(formData), clientIp),
  );
}

export async function declareContributionAction(
  token: string,
  _previousState: GiftActionState,
  formData: FormData,
): Promise<GiftActionState> {
  return runGuestAction(token, formData, (clientIp) =>
    declareContributionForGuest(
      getDb(),
      token,
      parseContributionForm(formData),
      clientIp,
    ),
  );
}
