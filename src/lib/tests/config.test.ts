import { describe, expect, it } from "vitest";
import { InvalidConfigError, parseConfig } from "@/lib/config";

const validEnv = {
  DATABASE_URL: "postgresql://user:pass@localhost:5432/db",
  AUTH_SECRET: "x".repeat(32),
};

describe("parseConfig", () => {
  it("accepts a valid environment", () => {
    expect(parseConfig({ ...validEnv, NODE_ENV: "production" }).NODE_ENV).toBe(
      "production",
    );
  });

  it("defaults NODE_ENV to development", () => {
    expect(parseConfig(validEnv).NODE_ENV).toBe("development");
  });

  it("requires a PostgreSQL DATABASE_URL", () => {
    expect(() =>
      parseConfig({ ...validEnv, DATABASE_URL: "mysql://x@y/z" }),
    ).toThrow(InvalidConfigError);
  });

  it("requires an AUTH_SECRET of at least 32 characters", () => {
    expect(() => parseConfig({ ...validEnv, AUTH_SECRET: "short" })).toThrow(
      InvalidConfigError,
    );
  });

  it("reports invalid keys without leaking their values", () => {
    const secretLookingValue = "super-secret-value";
    try {
      parseConfig({ ...validEnv, NODE_ENV: secretLookingValue });
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidConfigError);
      expect((error as InvalidConfigError).invalidKeys).toEqual(["NODE_ENV"]);
      expect((error as Error).message).not.toContain(secretLookingValue);
    }
  });
});
