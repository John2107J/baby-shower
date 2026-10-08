import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { LOGIN_RATE_LIMIT } from "@/modules/auth/domain/login-rules";
import {
  findAdminSessionVersion,
  upsertAdminUserPassword,
} from "@/modules/auth/repositories/admin-user-repository";
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
      admin: { id: expect.any(String), email: EMAIL, sessionVersion: 0 },
    });
  });

  it("a new password closes old sessions: the session version goes up", async () => {
    expect(
      await upsertAdminUserPassword(
        db,
        EMAIL,
        await hashPassword("otra-clave-larga"),
      ),
    ).toBe("updated");
    const result = await login(EMAIL, "otra-clave-larga");
    expect(result.ok && result.admin.sessionVersion).toBe(1);
    expect(
      await findAdminSessionVersion(db, result.ok ? result.admin.id : ""),
    ).toBe(1);
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

  it("never locks the parents out by email: the right password from another connection still works", async () => {
    for (let i = 0; i < LOGIN_RATE_LIMIT.limit * 2; i++)
      await login(EMAIL, "wrong", `198.51.100.${i % LOGIN_RATE_LIMIT.limit}`);
    expect((await login(EMAIL, PASSWORD, "192.0.2.99")).ok).toBe(true);
  });

  it("locks the IP after too many failures across different emails", async () => {
    for (let i = 0; i < LOGIN_RATE_LIMIT.limit; i++)
      await login(`x${i}@example.com`, "wrong");
    expect(await login(EMAIL, PASSWORD)).toEqual({
      ok: false,
      reason: "rate_limited",
    });
  });

  it("blocks the guessing connection even with the right password", async () => {
    for (let i = 0; i < LOGIN_RATE_LIMIT.limit; i++)
      await login(EMAIL, "wrong");
    expect(await login(EMAIL, PASSWORD)).toEqual({
      ok: false,
      reason: "rate_limited",
    });
  });

  it("resets the counter after a successful login", async () => {
    for (let i = 0; i < LOGIN_RATE_LIMIT.limit - 1; i++)
      await login(EMAIL, "wrong");
    expect((await login(EMAIL, PASSWORD)).ok).toBe(true);
    for (let i = 0; i < LOGIN_RATE_LIMIT.limit - 1; i++)
      await login(EMAIL, "wrong");
    expect((await login(EMAIL, PASSWORD)).ok).toBe(true);
  });
});
