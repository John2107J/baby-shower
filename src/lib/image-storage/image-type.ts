export type ImageType = { mimeType: string; extension: string };

/** Approved formats (CLAUDE.md §12, decision 21). */
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

const JPEG_SIGNATURE = [0xff, 0xd8, 0xff];
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const RIFF = [0x52, 0x49, 0x46, 0x46];
const WEBP = [0x57, 0x45, 0x42, 0x50];
const WEBP_MARKER_OFFSET = 8;

function startsWith(
  bytes: Uint8Array,
  signature: readonly number[],
  offset = 0,
): boolean {
  return signature.every((byte, index) => bytes[offset + index] === byte);
}

/**
 * Detects the real image type from the file's first bytes. The name and MIME
 * type sent by the browser are never trusted (CLAUDE.md §6).
 */
export function detectImageType(bytes: Uint8Array): ImageType | null {
  if (startsWith(bytes, JPEG_SIGNATURE))
    return { mimeType: "image/jpeg", extension: "jpg" };
  if (startsWith(bytes, PNG_SIGNATURE))
    return { mimeType: "image/png", extension: "png" };
  if (startsWith(bytes, RIFF) && startsWith(bytes, WEBP, WEBP_MARKER_OFFSET)) {
    return { mimeType: "image/webp", extension: "webp" };
  }
  return null;
}
