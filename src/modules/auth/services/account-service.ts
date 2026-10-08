import { createHash, timingSafeEqual } from "node:crypto";
import type { PrismaClient } from "@/generated/prisma/client";
import { consumeRateLimit, type RateLimitRule } from "@/lib/rate-limit";
import { LOGIN_RATE_LIMIT } from "@/modules/auth/domain/login-rules";
import { generateRecoveryCodes } from "@/modules/auth/domain/recovery-codes";
import {
  AccountAlreadyExistsError,
  adminAccountExists,
  changeAdminPassword,
  countUnusedRecoveryCodes,
  createFirstAdmin,
  findAdminPasswordHash,
  replaceRecoveryCodes,
  resetPasswordWithRecoveryCode,
} from "@/modules/auth/repositories/account-repository";
import type { AccountFormError } from "@/modules/auth/schemas/account-forms";
import { hashPassword, verifyPassword } from "@/modules/auth/services/password";

/** A setup code shorter than this counts as not configured: it would be guessable. */
export const MIN_SETUP_CODE_LENGTH = 16;

/** Same limit as the login: 5 attempts every 15 minutes. */
const ACCOUNT_RATE_LIMIT: RateLimitRule = LOGIN_RATE_LIMIT;
const setupKey = (ip: string) => `account-setup:ip:${ip}`;
const recoveryKey = (ip: string) => `account-recovery:ip:${ip}`;
const adminKey = (adminUserId: string) => `account:admin:${adminUserId}`;

type Failure<R extends string> = { ok: false; reason: R | AccountFormError };

async function hashCodes(codes: string[]): Promise<string[]> {
  return Promise.all(codes.map((code) => hashPassword(code)));
}

/** Compares digests so neither the length nor the content leaks through timing. */
function sameSecret(given: string, expected: string): boolean {
  const digest = (value: string) => createHash("sha256").update(value).digest();
  return timingSafeEqual(digest(given), digest(expected));
}

/** Whether /admin/crear-cuenta should exist at all (phase 7c, option A). */
export async function isAccountSetupOpen(
  db: PrismaClient,
  configuredSetupCode: string | undefined,
): Promise<boolean> {
  if (
    !configuredSetupCode ||
    configuredSetupCode.length < MIN_SETUP_CODE_LENGTH
  )
    return false;
  return !(await adminAccountExists(db));
}

export async function createFirstAccount(
  db: PrismaClient,
  input:
    | { ok: true; data: { email: string; password: string; setupCode: string } }
    | { ok: false; error: AccountFormError },
  configuredSetupCode: string | undefined,
  clientIp: string,
  now: Date = new Date(),
): Promise<
  | { ok: true; recoveryCodes: string[] }
  | Failure<"closed" | "wrong_setup_code" | "rate_limited">
> {
  if (!(await isAccountSetupOpen(db, configuredSetupCode)))
    return { ok: false, reason: "closed" };
  const limit = await consumeRateLimit(
    db,
    setupKey(clientIp),
    ACCOUNT_RATE_LIMIT,
    now,
  );
  if (!limit.allowed) return { ok: false, reason: "rate_limited" };
  if (!input.ok) return { ok: false, reason: input.error };
  if (!sameSecret(input.data.setupCode, configuredSetupCode!))
    return { ok: false, reason: "wrong_setup_code" };

  const recoveryCodes = generateRecoveryCodes();
  try {
    await createFirstAdmin(db, {
      email: input.data.email,
      passwordHash: await hashPassword(input.data.password),
      codeHashes: await hashCodes(recoveryCodes),
    });
  } catch (error) {
    if (error instanceof AccountAlreadyExistsError)
      return { ok: false, reason: "closed" };
    throw error;
  }
  return { ok: true, recoveryCodes };
}

export async function recoverPassword(
  db: PrismaClient,
  input:
    | { ok: true; data: { email: string; code: string; password: string } }
    | { ok: false; error: AccountFormError },
  clientIp: string,
  now: Date = new Date(),
): Promise<{ ok: true } | Failure<"wrong_code" | "rate_limited">> {
  const limit = await consumeRateLimit(
    db,
    recoveryKey(clientIp),
    ACCOUNT_RATE_LIMIT,
    now,
  );
  if (!limit.allowed) return { ok: false, reason: "rate_limited" };
  if (!input.ok) return { ok: false, reason: input.error };
  // Same answer for an unknown email, a malformed code and a wrong or used code.
  if (!input.data.code) return { ok: false, reason: "wrong_code" };
  const reset = await resetPasswordWithRecoveryCode(
    db,
    {
      email: input.data.email,
      code: input.data.code,
      newPasswordHash: await hashPassword(input.data.password),
    },
    now,
  );
  return reset ? { ok: true } : { ok: false, reason: "wrong_code" };
}

/** Sensitive changes from the panel ask for the current password again. */
async function checkCurrentPassword(
  db: PrismaClient,
  adminUserId: string,
  currentPassword: string,
  now: Date,
): Promise<"ok" | "wrong_password" | "rate_limited"> {
  const limit = await consumeRateLimit(
    db,
    adminKey(adminUserId),
    ACCOUNT_RATE_LIMIT,
    now,
  );
  if (!limit.allowed) return "rate_limited";
  const admin = await findAdminPasswordHash(db, adminUserId);
  if (!admin || !(await verifyPassword(admin.passwordHash, currentPassword)))
    return "wrong_password";
  return "ok";
}

export async function changePassword(
  db: PrismaClient,
  adminUserId: string,
  input:
    | { ok: true; data: { currentPassword: string; password: string } }
    | { ok: false; error: AccountFormError },
  now: Date = new Date(),
): Promise<{ ok: true } | Failure<"wrong_password" | "rate_limited">> {
  if (!input.ok) return { ok: false, reason: input.error };
  const check = await checkCurrentPassword(
    db,
    adminUserId,
    input.data.currentPassword,
    now,
  );
  if (check !== "ok") return { ok: false, reason: check };
  await changeAdminPassword(
    db,
    adminUserId,
    await hashPassword(input.data.password),
  );
  return { ok: true };
}

export async function regenerateRecoveryCodes(
  db: PrismaClient,
  adminUserId: string,
  currentPassword: string | null,
  now: Date = new Date(),
): Promise<
  | { ok: true; recoveryCodes: string[] }
  | Failure<"wrong_password" | "rate_limited">
> {
  if (currentPassword === null) return { ok: false, reason: "wrong_password" };
  const check = await checkCurrentPassword(
    db,
    adminUserId,
    currentPassword,
    now,
  );
  if (check !== "ok") return { ok: false, reason: check };
  const recoveryCodes = generateRecoveryCodes();
  await replaceRecoveryCodes(db, adminUserId, await hashCodes(recoveryCodes));
  return { ok: true, recoveryCodes };
}

/** How many unused recovery codes the account still has. */
export function getRemainingRecoveryCodes(
  db: PrismaClient,
  adminUserId: string,
): Promise<number> {
  return countUnusedRecoveryCodes(db, adminUserId);
}
