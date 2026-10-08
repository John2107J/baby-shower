import { devFileStorage } from "@/lib/image-storage/dev-file-storage";
import type { ImageStorage } from "@/lib/image-storage/image-storage";
import { vercelBlobStorage } from "@/lib/image-storage/vercel-blob-storage";

/**
 * Vercel Blob credentials come in two shapes: newer stores set BLOB_STORE_ID
 * and authenticate through Vercel's OIDC token; older ones set
 * BLOB_READ_WRITE_TOKEN. @vercel/blob resolves either on its own.
 */
export function hasBlobCredentials(
  env: Record<string, string | undefined> = process.env,
): boolean {
  return Boolean(env["BLOB_STORE_ID"] || env["BLOB_READ_WRITE_TOKEN"]);
}

export function getImageStorage(): ImageStorage {
  if (hasBlobCredentials()) return vercelBlobStorage;
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Vercel Blob credentials (BLOB_STORE_ID or BLOB_READ_WRITE_TOKEN) are required in production",
    );
  }
  return devFileStorage;
}
