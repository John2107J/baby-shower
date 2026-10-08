import { del, put } from "@vercel/blob";
import type { ImageStorage } from "@/lib/image-storage/image-storage";

/** Uses BLOB_READ_WRITE_TOKEN, which Vercel sets when the Blob store is connected. */
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
