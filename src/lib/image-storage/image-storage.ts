export type StoredImage = { url: string };

/** Abstraction over where gift photos live, so services can be tested without Vercel Blob. */
export interface ImageStorage {
  upload(
    pathname: string,
    bytes: Uint8Array,
    mimeType: string,
  ): Promise<StoredImage>;
  delete(url: string): Promise<void>;
}
