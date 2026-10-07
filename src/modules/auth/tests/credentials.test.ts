import { describe, expect, it } from "vitest";
import { credentialsSchema } from "@/modules/auth/schemas/credentials";

describe("credentialsSchema", () => {
  it("normalizes the email", () => {
    const parsed = credentialsSchema.parse({
      email: "  Padres@Example.COM ",
      password: "x",
    });
    expect(parsed.email).toBe("padres@example.com");
  });

  it("strips extra fields added by Auth.js", () => {
    const parsed = credentialsSchema.parse({
      email: "a@b.co",
      password: "x",
      csrfToken: "t",
      callbackUrl: "/admin",
    });
    expect(parsed).toEqual({ email: "a@b.co", password: "x" });
  });

  it.each([
    { email: "not-an-email", password: "x" },
    { email: "a@b.co", password: "" },
    { email: "a@b.co", password: "x".repeat(257) },
    { email: "a@b.co" },
  ])("rejects invalid input %#", (input) => {
    expect(credentialsSchema.safeParse(input).success).toBe(false);
  });
});
