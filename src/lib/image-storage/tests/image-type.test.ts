import { describe, expect, it } from "vitest";
import { detectImageType } from "@/lib/image-storage/image-type";
import { JPEG_BYTES, PNG_BYTES, WEBP_BYTES } from "@/test/image-fixtures";

describe("detectImageType", () => {
  it.each([
    [JPEG_BYTES, "image/jpeg", "jpg"],
    [PNG_BYTES, "image/png", "png"],
    [WEBP_BYTES, "image/webp", "webp"],
  ])("detects %#", (bytes, mimeType, extension) => {
    expect(detectImageType(bytes)).toEqual({ mimeType, extension });
  });

  it.each([
    [
      "text pretending to be an image",
      new TextEncoder().encode("<svg onload=alert(1)>"),
    ],
    ["GIF", new TextEncoder().encode("GIF89a")],
    [
      "RIFF that is not WebP (e.g. WAV)",
      new TextEncoder().encode("RIFF....WAVEfmt "),
    ],
    ["empty file", new Uint8Array()],
  ])("rejects %s", (_label, bytes) => {
    expect(detectImageType(bytes)).toBeNull();
  });
});
