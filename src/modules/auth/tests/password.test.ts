import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/modules/auth/services/password";

describe("password hashing", () => {
  it("produces an argon2id hash that verifies the original password", async () => {
    const hash = await hashPassword("correct horse battery staple");
    expect(hash.startsWith("$argon2id$")).toBe(true);
    expect(await verifyPassword(hash, "correct horse battery staple")).toBe(
      true,
    );
  });

  it("rejects a wrong password", async () => {
    const hash = await hashPassword("correct horse battery staple");
    expect(await verifyPassword(hash, "wrong password")).toBe(false);
  });

  it("never stores the plain password inside the hash", async () => {
    expect(await hashPassword("plain-text-secret")).not.toContain(
      "plain-text-secret",
    );
  });

  it("treats a malformed hash as a non-match instead of throwing", async () => {
    expect(await verifyPassword("not-a-hash", "anything")).toBe(false);
  });
});
