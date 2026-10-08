import { randomUUID } from "node:crypto";
import {
  MAX_IMAGE_BYTES,
  detectImageType,
} from "@/lib/image-storage/image-type";
import type { ImageStorage } from "@/lib/image-storage/image-storage";

export type ImageValidationError = "too_large" | "invalid_type";

export const IMAGE_ERROR_MESSAGES: Record<
  ImageValidationError | "required",
  string
> = {
  required: "Subí una foto del regalo.",
  too_large: "La foto pesa más de 4 MB. Probá con una más liviana.",
  invalid_type: "La foto tiene que ser JPG, PNG o WebP.",
};

export async function readValidatedImage(
  file: File,
): Promise<
  | { ok: true; bytes: Uint8Array; mimeType: string; extension: string }
  | { ok: false; error: ImageValidationError }
> {
  // Size is checked before reading so huge uploads are rejected cheaply.
  if (file.size > MAX_IMAGE_BYTES) return { ok: false, error: "too_large" };
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (bytes.byteLength > MAX_IMAGE_BYTES)
    return { ok: false, error: "too_large" };
  const type = detectImageType(bytes);
  if (!type) return { ok: false, error: "invalid_type" };
  return { ok: true, bytes, ...type };
}

/** Stores the photo under a random name; the original file name is never used. */
export async function storeGiftImage(
  storage: ImageStorage,
  image: { bytes: Uint8Array; mimeType: string; extension: string },
): Promise<string> {
  const { url } = await storage.upload(
    `gifts/${randomUUID()}.${image.extension}`,
    image.bytes,
    image.mimeType,
  );
  return url;
}
