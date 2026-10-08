import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import type { ImageStorage } from "@/lib/image-storage/image-storage";

/**
 * Local-only storage for development without a Blob token. Files are served by
 * /api/dev-uploads, which refuses to work in production.
 */
export const DEV_UPLOADS_DIR = path.join(process.cwd(), ".dev-uploads");
export const DEV_UPLOADS_ROUTE = "/api/dev-uploads";

const SAFE_FILE_NAME = /^[a-z0-9-]+\.(jpg|png|webp)$/;

export function resolveDevUploadPath(fileName: string): string | null {
  return SAFE_FILE_NAME.test(fileName)
    ? path.join(DEV_UPLOADS_DIR, fileName)
    : null;
}

export const devFileStorage: ImageStorage = {
  async upload(pathname, bytes) {
    const fileName = path.basename(pathname);
    const target = resolveDevUploadPath(fileName);
    if (!target) throw new Error("Invalid dev upload name");
    await mkdir(DEV_UPLOADS_DIR, { recursive: true });
    await writeFile(target, bytes);
    return { url: `${DEV_UPLOADS_ROUTE}/${fileName}` };
  },
  async delete(url) {
    const target = resolveDevUploadPath(path.basename(url));
    if (target) await unlink(target).catch(() => undefined);
  },
};

export function readDevUpload(fileName: string): Promise<Buffer> | null {
  const target = resolveDevUploadPath(fileName);
  return target ? readFile(target) : null;
}
