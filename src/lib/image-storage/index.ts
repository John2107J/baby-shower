import { devFileStorage } from "@/lib/image-storage/dev-file-storage";
import type { ImageStorage } from "@/lib/image-storage/image-storage";
import { vercelBlobStorage } from "@/lib/image-storage/vercel-blob-storage";

export function getImageStorage(): ImageStorage {
  if (process.env["BLOB_READ_WRITE_TOKEN"]) return vercelBlobStorage;
  if (process.env.NODE_ENV === "production") {
    throw new Error("BLOB_READ_WRITE_TOKEN is required in production");
  }
  return devFileStorage;
}
