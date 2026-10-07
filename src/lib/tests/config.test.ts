import { describe, expect, it } from "vitest";
import { InvalidConfigError, parseConfig } from "@/lib/config";

describe("parseConfig", () => {
  it("accepts a valid environment", () => {
    expect(parseConfig({ NODE_ENV: "production" })).toEqual({
      NODE_ENV: "production",
    });
  });

  it("defaults NODE_ENV to development", () => {
    expect(parseConfig({}).NODE_ENV).toBe("development");
  });

  it("reports invalid keys without leaking their values", () => {
    const secretLookingValue = "super-secret-value";
    try {
      parseConfig({ NODE_ENV: secretLookingValue });
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidConfigError);
      expect((error as InvalidConfigError).invalidKeys).toEqual(["NODE_ENV"]);
      expect((error as Error).message).not.toContain(secretLookingValue);
    }
  });
});
