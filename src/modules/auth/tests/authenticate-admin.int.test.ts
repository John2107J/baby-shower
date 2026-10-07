import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { LOGIN_RATE_LIMIT } from "@/modules/auth/domain/login-rules";
import { authenticateAdmin } from "@/modules/auth/services/authenticate-admin";
import { hashPassword } from "@/modules/auth/services/password";
import { createTestDb, resetDatabase } from "@/test/test-db";

const db = createTestDb();
const EMAIL = "padres@example.com";
const PASSWORD = "una-clave-larga-de-prueba";
const IP = "203.0.113.10";

beforeEach(async () => {
  await resetDatabase(db);
  await db.adminUser.create({
    data: { email: EMAIL, passwordHash: await hashPassword(PASSWORD) },
  });
});
afterAll(() => db.$disconnect());

const login = (email: string, password: string, ip = IP) =>
  authenticateAdmin(db, { email, password }, ip);

describe("authenticateAdmin", () => {
  it("accepts the right credentials, case-insensitively on the email", async () => {
    const result = await login("Padres@Example.com", PASSWORD);
    expect(result).toEqual({
      ok: true,
      admin: { id: expect.any(String), email: EMAIL },
    });
  });

  it("rejects a wrong password", async () => {
    expect(await login(EMAIL, "wrong")).toEqual({
      ok: false,
      reason: "invalid_credentials",
    });
  });

  it("gives the same answer for an unknown email (no account enumeration)", async () => {
    expect(await login("nadie@example.com", PASSWORD)).toEqual({
      ok: false,
      reason: "invalid_credentials",
    });
  });

  it("rejects malformed input", async () => {
    expect(await authenticateAdmin(db, { email: 42 }, IP)).toEqual({
      ok: false,
      reason: "invalid_credentials",
    });
  });

  it("locks the email after too many failures, even with the right password", async () => {
    for (let i = 0; i < LOGIN_RATE_LIMIT.limit; i++)
      await login(EMAIL, "wrong");
    expect(await login(EMAIL, PASSWORD)).toEqual({
      ok: false,
      reason: "rate_limited",
    });
  });

  it("locks the email even when attempts come from different IPs", async () => {
    for (let i = 0; i < LOGIN_RATE_LIMIT.limit; i++)
      await login(EMAIL, "wrong", `198.51.100.${i}`);
    expect(await login(EMAIL, PASSWORD, "192.0.2.99")).toEqual({
      ok: false,
      reason: "rate_limited",
    });
  });

  it("locks the IP after too many failures across different emails", async () => {
    for (let i = 0; i < LOGIN_RATE_LIMIT.limit; i++)
      await login(`x${i}@example.com`, "wrong");
    expect(await login(EMAIL, PASSWORD)).toEqual({
      ok: false,
      reason: "rate_limited",
    });
  });

  it("resets the counters after a successful login", async () => {
    for (let i = 0; i < LOGIN_RATE_LIMIT.limit - 1; i++)
      await login(EMAIL, "wrong");
    expect((await login(EMAIL, PASSWORD)).ok).toBe(true);
    for (let i = 0; i < LOGIN_RATE_LIMIT.limit - 1; i++)
      await login(EMAIL, "wrong");
    expect((await login(EMAIL, PASSWORD)).ok).toBe(true);
  });
});
