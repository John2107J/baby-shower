import type { ImageStorage } from "@/lib/image-storage/image-storage";

export const JPEG_BYTES = new Uint8Array([
  0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46,
]);
export const PNG_BYTES = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00,
]);
export const WEBP_BYTES = new Uint8Array([
  0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50, 0x56,
  0x50,
]);

export function fileFrom(
  bytes: Uint8Array,
  name = "foto.jpg",
  type = "image/jpeg",
): File {
  return new File([new Uint8Array(bytes)], name, { type });
}

/** In-memory ImageStorage that records uploads and deletions. */
export function createFakeStorage(options: { failUploads?: boolean } = {}) {
  const stored = new Map<string, Uint8Array>();
  const deleted: string[] = [];
  const storage: ImageStorage = {
    async upload(pathname, bytes) {
      if (options.failUploads) throw new Error("upload failed");
      const url = `https://test.public.blob.vercel-storage.com/${pathname}`;
      stored.set(url, bytes);
      return { url };
    },
    async delete(url) {
      deleted.push(url);
      stored.delete(url);
    },
  };
  return { storage, stored, deleted };
}
