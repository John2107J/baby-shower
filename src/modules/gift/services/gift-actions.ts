"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { getImageStorage } from "@/lib/image-storage";
import { logger } from "@/lib/logger";
import { ADMIN_ROUTES } from "@/lib/routes";
import { requireAdmin } from "@/modules/auth/services/require-admin";
import {
  type GiftFormValues,
  readGiftForm,
} from "@/modules/gift/schemas/gift-form";
import {
  type GiftFieldErrors,
  type SaveGiftResult,
  archiveGift,
  createGiftFromForm,
  reorderGift,
  updateGiftFromForm,
} from "@/modules/gift/services/gift-service";

// Submitted values travel back so React's form reset does not wipe them.
// A selected file cannot be sent back to the browser: the form asks to pick it again.
export type GiftFormState =
  | { status: "idle" }
  | {
      status: "invalid";
      values: GiftFormValues;
      fieldErrors: GiftFieldErrors;
      hadImage: boolean;
    }
  | { status: "error"; values: GiftFormValues; hadImage: boolean }
  | { status: "not_found" };

async function runGiftSave(
  formData: FormData,
  save: (values: GiftFormValues, image: File | null) => Promise<SaveGiftResult>,
): Promise<GiftFormState> {
  await requireAdmin();
  const { values, image } = readGiftForm(formData);
  const hadImage = image !== null;
  let result: SaveGiftResult;
  try {
    result = await save(values, image);
  } catch (error) {
    logger.error("gift save failed", {
      errorName: error instanceof Error ? error.name : "unknown",
    });
    return { status: "error", values, hadImage };
  }
  if (!result.ok) {
    return result.reason === "not_found"
      ? { status: "not_found" }
      : {
          status: "invalid",
          values,
          fieldErrors: result.fieldErrors,
          hadImage,
        };
  }
  revalidatePath(ADMIN_ROUTES.gifts);
  redirect(ADMIN_ROUTES.gifts);
}

export async function createGiftAction(
  _previousState: GiftFormState,
  formData: FormData,
): Promise<GiftFormState> {
  return runGiftSave(formData, (values, image) =>
    createGiftFromForm(getDb(), getImageStorage(), values, image),
  );
}

export async function updateGiftAction(
  giftId: string,
  _previousState: GiftFormState,
  formData: FormData,
): Promise<GiftFormState> {
  return runGiftSave(formData, (values, image) =>
    updateGiftFromForm(getDb(), getImageStorage(), giftId, values, image),
  );
}

export async function setGiftArchivedAction(
  giftId: string,
  archived: boolean,
): Promise<void> {
  await requireAdmin();
  await archiveGift(getDb(), giftId, archived);
  revalidatePath(ADMIN_ROUTES.gifts);
}

export async function moveGiftAction(
  giftId: string,
  direction: "up" | "down",
): Promise<void> {
  await requireAdmin();
  await reorderGift(getDb(), giftId, direction);
  revalidatePath(ADMIN_ROUTES.gifts);
}
