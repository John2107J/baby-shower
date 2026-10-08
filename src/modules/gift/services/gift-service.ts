import { z } from "zod";
import type { PrismaClient } from "@/generated/prisma/client";
import type { ImageStorage } from "@/lib/image-storage/image-storage";
import { logger } from "@/lib/logger";
import {
  type AdminGiftRecord,
  GiftNotFoundError,
  QuantityBelowClaimedError,
  createGift,
  findGiftForAdmin,
  listGiftsForAdmin,
  moveGift,
  setGiftArchived,
  updateGift,
} from "@/modules/gift/repositories/gift-repository";
import {
  type GiftFormField,
  type GiftFormValues,
  giftFormSchema,
} from "@/modules/gift/schemas/gift-form";
import {
  IMAGE_ERROR_MESSAGES,
  readValidatedImage,
  storeGiftImage,
} from "@/modules/gift/services/gift-image";

export type GiftFieldErrors = Partial<Record<GiftFormField, string>>;

export type SaveGiftResult =
  | { ok: true; id: string }
  | { ok: false; reason: "invalid"; fieldErrors: GiftFieldErrors }
  | { ok: false; reason: "not_found" };

const giftIdSchema = z.uuid();

export function isValidGiftId(id: string): boolean {
  return giftIdSchema.safeParse(id).success;
}

export function listGifts(db: PrismaClient): Promise<AdminGiftRecord[]> {
  return listGiftsForAdmin(db);
}

export function getGift(
  db: PrismaClient,
  id: string,
): Promise<AdminGiftRecord | null> {
  return isValidGiftId(id) ? findGiftForAdmin(db, id) : Promise.resolve(null);
}

function collectFieldErrors(values: GiftFormValues) {
  const parsed = giftFormSchema.safeParse(values);
  if (parsed.success)
    return { data: parsed.data, fieldErrors: {} as GiftFieldErrors };
  const fieldErrors: GiftFieldErrors = {};
  for (const issue of parsed.error.issues) {
    const field = issue.path[0] as GiftFormField | undefined;
    if (field && !fieldErrors[field]) fieldErrors[field] = issue.message;
  }
  return { data: null, fieldErrors };
}

async function deleteImageQuietly(
  storage: ImageStorage,
  url: string,
): Promise<void> {
  try {
    await storage.delete(url);
  } catch (error) {
    // An orphaned photo is harmless; never fail the user's action because of it.
    logger.warn("gift image cleanup failed", {
      errorName: error instanceof Error ? error.name : "unknown",
    });
  }
}

export async function createGiftFromForm(
  db: PrismaClient,
  storage: ImageStorage,
  values: GiftFormValues,
  imageFile: File | null,
): Promise<SaveGiftResult> {
  const { data, fieldErrors } = collectFieldErrors(values);
  const image = imageFile ? await readValidatedImage(imageFile) : null;
  if (!imageFile) fieldErrors.image = IMAGE_ERROR_MESSAGES.required;
  else if (image && !image.ok)
    fieldErrors.image = IMAGE_ERROR_MESSAGES[image.error];
  if (!data || !image?.ok) return { ok: false, reason: "invalid", fieldErrors };

  const imageUrl = await storeGiftImage(storage, image);
  try {
    const id = await createGift(db, {
      title: data.title,
      productUrl: data.productUrl,
      referencePriceCents: data.referencePrice,
      quantity: data.quantity,
      imageUrl,
    });
    return { ok: true, id };
  } catch (error) {
    await deleteImageQuietly(storage, imageUrl);
    throw error;
  }
}

export async function updateGiftFromForm(
  db: PrismaClient,
  storage: ImageStorage,
  id: string,
  values: GiftFormValues,
  imageFile: File | null,
): Promise<SaveGiftResult> {
  if (!isValidGiftId(id)) return { ok: false, reason: "not_found" };
  const { data, fieldErrors } = collectFieldErrors(values);
  const image = imageFile ? await readValidatedImage(imageFile) : null;
  if (image && !image.ok) fieldErrors.image = IMAGE_ERROR_MESSAGES[image.error];
  if (!data || (image && !image.ok))
    return { ok: false, reason: "invalid", fieldErrors };

  const newImageUrl = image?.ok
    ? await storeGiftImage(storage, image)
    : undefined;
  try {
    const { previousImageUrl } = await updateGift(db, id, {
      title: data.title,
      productUrl: data.productUrl,
      referencePriceCents: data.referencePrice,
      quantity: data.quantity,
      ...(newImageUrl ? { imageUrl: newImageUrl } : {}),
    });
    if (newImageUrl) await deleteImageQuietly(storage, previousImageUrl);
    return { ok: true, id };
  } catch (error) {
    if (newImageUrl) await deleteImageQuietly(storage, newImageUrl);
    if (error instanceof GiftNotFoundError)
      return { ok: false, reason: "not_found" };
    if (error instanceof QuantityBelowClaimedError) {
      return {
        ok: false,
        reason: "invalid",
        fieldErrors: {
          quantity: `Ya hay ${error.claimedUnits} reservada(s): la cantidad no puede ser menor.`,
        },
      };
    }
    throw error;
  }
}

export function archiveGift(
  db: PrismaClient,
  id: string,
  archived: boolean,
): Promise<boolean> {
  return isValidGiftId(id)
    ? setGiftArchived(db, id, archived)
    : Promise.resolve(false);
}

export function reorderGift(
  db: PrismaClient,
  id: string,
  direction: "up" | "down",
): Promise<boolean> {
  return isValidGiftId(id)
    ? moveGift(db, id, direction)
    : Promise.resolve(false);
}
