import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { LOGIN_RATE_LIMIT } from "@/modules/auth/domain/login-rules";
import { RECOVERY_CODE_COUNT } from "@/modules/auth/domain/recovery-codes";
import { countUnusedRecoveryCodes } from "@/modules/auth/repositories/account-repository";
import {
  changePassword,
  createFirstAccount,
  isAccountSetupOpen,
  recoverPassword,
  regenerateRecoveryCodes,
} from "@/modules/auth/services/account-service";
import { authenticateAdmin } from "@/modules/auth/services/authenticate-admin";
import { createTestDb, resetDatabase } from "@/test/test-db";

const db = createTestDb();
const IP = "203.0.113.20";
const SETUP_CODE = "codigo-de-alta-de-prueba-123";
const EMAIL = "padres@example.com";
const PASSWORD = "una-clave-larga-de-prueba";
const NEW_PASSWORD = "otra-clave-larga-de-prueba";

beforeEach(() => resetDatabase(db));
afterAll(() => db.$disconnect());

const setup = (
  overrides: Partial<{
    email: string;
    password: string;
    setupCode: string;
  }> = {},
  ip = IP,
) =>
  createFirstAccount(
    db,
    {
      ok: true,
      data: {
        email: EMAIL,
        password: PASSWORD,
        setupCode: SETUP_CODE,
        ...overrides,
      },
    },
    SETUP_CODE,
    ip,
  );

async function createAccount(): Promise<{ id: string; codes: string[] }> {
  const result = await setup();
  if (!result.ok) throw new Error(`setup failed: ${result.reason}`);
  const { id } = await db.adminUser.findUniqueOrThrow({
    where: { email: EMAIL },
  });
  return { id, codes: result.recoveryCodes };
}

const recover = (
  code: string,
  password = NEW_PASSWORD,
  ip = IP,
  email = EMAIL,
) => recoverPassword(db, { ok: true, data: { email, code, password } }, ip);

const canLogin = async (password: string) =>
  (await authenticateAdmin(db, { email: EMAIL, password }, "192.0.2.1")).ok;

describe("createFirstAccount (option A: one shared account)", () => {
  it("creates the account with 8 recovery codes, stored only as hashes", async () => {
    const { id, codes } = await createAccount();
    expect(codes).toHaveLength(RECOVERY_CODE_COUNT);
    expect(await countUnusedRecoveryCodes(db, id)).toBe(RECOVERY_CODE_COUNT);
    const stored = await db.adminRecoveryCode.findMany();
    for (const row of stored) expect(codes).not.toContain(row.codeHash);
    expect(await canLogin(PASSWORD)).toBe(true);
  });

  it("closes for good once an account exists", async () => {
    await createAccount();
    expect(await isAccountSetupOpen(db, SETUP_CODE)).toBe(false);
    expect(await setup({ email: "otro@example.com" })).toEqual({
      ok: false,
      reason: "closed",
    });
    expect(await db.adminUser.count()).toBe(1);
  });

  it("lets only one of two simultaneous sign-ups win", async () => {
    const results = await Promise.all([
      setup({ email: "a@example.com" }, "198.51.100.1"),
      setup({ email: "b@example.com" }, "198.51.100.2"),
    ]);
    expect(results.filter((r) => r.ok)).toHaveLength(1);
    expect(results).toContainEqual({ ok: false, reason: "closed" });
    expect(await db.adminUser.count()).toBe(1);
  });

  it("requires the right setup code", async () => {
    expect(await setup({ setupCode: "otro-codigo-cualquiera-123" })).toEqual({
      ok: false,
      reason: "wrong_setup_code",
    });
    expect(await db.adminUser.count()).toBe(0);
  });

  it("stays closed when the setup code is missing or too short", async () => {
    expect(await isAccountSetupOpen(db, undefined)).toBe(false);
    expect(await isAccountSetupOpen(db, "corto")).toBe(false);
    expect(
      await createFirstAccount(
        db,
        {
          ok: true,
          data: { email: EMAIL, password: PASSWORD, setupCode: "corto" },
        },
        "corto",
        IP,
      ),
    ).toEqual({ ok: false, reason: "closed" });
  });

  it("limits attempts per connection", async () => {
    for (let i = 0; i < LOGIN_RATE_LIMIT.limit; i++)
      await setup({ setupCode: "otro-codigo-cualquiera-123" });
    expect(await setup()).toEqual({ ok: false, reason: "rate_limited" });
  });
});

describe("recoverPassword", () => {
  it("sets a new password with a code, spends it and closes open sessions", async () => {
    const { id, codes } = await createAccount();
    expect(await recover(codes[3]!)).toEqual({
      ok: true,
    });
    expect(await canLogin(NEW_PASSWORD)).toBe(true);
    expect(await canLogin(PASSWORD)).toBe(false);
    expect(await countUnusedRecoveryCodes(db, id)).toBe(
      RECOVERY_CODE_COUNT - 1,
    );
    expect(
      (await db.adminUser.findUniqueOrThrow({ where: { id } })).sessionVersion,
    ).toBe(1);
    expect(await recover(codes[3]!, "tercera-clave-larga")).toEqual({
      ok: false,
      reason: "wrong_code",
    });
  });

  it("uses a code only once even with two simultaneous requests", async () => {
    const { id, codes } = await createAccount();
    const results = await Promise.all([
      recover(codes[0]!, "clave-nueva-uno-larga", "198.51.100.1"),
      recover(codes[0]!, "clave-nueva-dos-larga", "198.51.100.2"),
    ]);
    expect(results).toContainEqual({ ok: true });
    expect(results).toContainEqual({ ok: false, reason: "wrong_code" });
    expect(await countUnusedRecoveryCodes(db, id)).toBe(
      RECOVERY_CODE_COUNT - 1,
    );
  });

  it("answers the same for an unknown email, a wrong code and a malformed one", async () => {
    const { codes } = await createAccount();
    const wrong = { ok: false, reason: "wrong_code" };
    expect(
      await recover(codes[0]!, NEW_PASSWORD, IP, "nadie@example.com"),
    ).toEqual(wrong);
    expect(await recover("AAAAA-AAAAA")).toEqual(wrong);
    expect(await recover("")).toEqual(wrong);
    expect(await canLogin(PASSWORD)).toBe(true);
  });

  it("limits attempts per connection", async () => {
    const { codes } = await createAccount();
    for (let i = 0; i < LOGIN_RATE_LIMIT.limit; i++)
      await recover("AAAAA-AAAAA");
    expect(await recover(codes[0]!)).toEqual({
      ok: false,
      reason: "rate_limited",
    });
  });
});

describe("panel: change password and new codes", () => {
  it("changes the password only with the current one and closes sessions", async () => {
    const { id } = await createAccount();
    const change = (currentPassword: string) =>
      changePassword(db, id, {
        ok: true,
        data: { currentPassword, password: NEW_PASSWORD },
      });
    expect(await change("incorrecta-larga")).toEqual({
      ok: false,
      reason: "wrong_password",
    });
    expect(await change(PASSWORD)).toEqual({ ok: true });
    expect(await canLogin(NEW_PASSWORD)).toBe(true);
    expect(
      (await db.adminUser.findUniqueOrThrow({ where: { id } })).sessionVersion,
    ).toBe(1);
  });

  it("new codes replace the old ones and need the current password", async () => {
    const { id, codes: oldCodes } = await createAccount();
    expect(await regenerateRecoveryCodes(db, id, "incorrecta-larga")).toEqual({
      ok: false,
      reason: "wrong_password",
    });
    const result = await regenerateRecoveryCodes(db, id, PASSWORD);
    if (!result.ok) throw new Error("expected new codes");
    expect(await db.adminRecoveryCode.count()).toBe(RECOVERY_CODE_COUNT);
    expect(await recover(oldCodes[0]!)).toEqual({
      ok: false,
      reason: "wrong_code",
    });
    expect(await recover(result.recoveryCodes[0]!)).toEqual({ ok: true });
  });
});
