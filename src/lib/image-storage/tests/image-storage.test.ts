import { describe, expect, it } from "vitest";
import { hasBlobCredentials } from "@/lib/image-storage";

describe("hasBlobCredentials", () => {
  it("accepts newer stores that only set BLOB_STORE_ID (OIDC)", () => {
    expect(hasBlobCredentials({ BLOB_STORE_ID: "store_abc" })).toBe(true);
  });

  it("accepts older stores with BLOB_READ_WRITE_TOKEN", () => {
    expect(
      hasBlobCredentials({ BLOB_READ_WRITE_TOKEN: "vercel_blob_rw_x" }),
    ).toBe(true);
  });

  it("reports no credentials when neither is set", () => {
    expect(
      hasBlobCredentials({
        BLOB_STORE_ID: "",
        BLOB_READ_WRITE_TOKEN: undefined,
      }),
    ).toBe(false);
  });
});
