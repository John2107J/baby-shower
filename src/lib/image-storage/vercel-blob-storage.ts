import { del, put } from "@vercel/blob";
import type { ImageStorage } from "@/lib/image-storage/image-storage";

/** Credentials are resolved by @vercel/blob (BLOB_STORE_ID + OIDC, or BLOB_READ_WRITE_TOKEN). */
export const vercelBlobStorage: ImageStorage = {
  async upload(pathname, bytes, mimeType) {
    const blob = await put(pathname, Buffer.from(bytes), {
      access: "public",
      contentType: mimeType,
      addRandomSuffix: false,
    });
    return { url: blob.url };
  },
  async delete(url) {
    await del(url);
  },
};
