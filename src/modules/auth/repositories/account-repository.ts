import type { PrismaClient } from "@/generated/prisma/client";
import { RECOVERY_CODE_COUNT } from "@/modules/auth/domain/recovery-codes";
import {
  getDummyPasswordHash,
  verifyPassword,
} from "@/modules/auth/services/password";

export class AccountAlreadyExistsError extends Error {
  constructor() {
    super("An admin account already exists");
    this.name = "AccountAlreadyExistsError";
  }
}

export async function adminAccountExists(db: PrismaClient): Promise<boolean> {
  return (await db.adminUser.count()) > 0;
}

/**
 * Option A (phase 7c): a single shared account. The table lock makes two
 * simultaneous sign-ups wait for each other, so only the first one wins.
 */
export async function createFirstAdmin(
  db: PrismaClient,
  account: { email: string; passwordHash: string; codeHashes: string[] },
): Promise<void> {
  await db.$transaction(async (tx) => {
    await tx.$executeRaw`LOCK TABLE "AdminUser" IN SHARE ROW EXCLUSIVE MODE`;
    if ((await tx.adminUser.count()) > 0) throw new AccountAlreadyExistsError();
    await tx.adminUser.create({
      data: {
        email: account.email,
        passwordHash: account.passwordHash,
        recoveryCodes: {
          create: account.codeHashes.map((codeHash) => ({ codeHash })),
        },
      },
    });
  });
}

/** New codes replace every previous one, used or not. */
export async function replaceRecoveryCodes(
  db: PrismaClient,
  adminUserId: string,
  codeHashes: string[],
): Promise<void> {
  await db.$transaction([
    db.adminRecoveryCode.deleteMany({ where: { adminUserId } }),
    db.adminRecoveryCode.createMany({
      data: codeHashes.map((codeHash) => ({ adminUserId, codeHash })),
    }),
  ]);
}

export async function countUnusedRecoveryCodes(
  db: PrismaClient,
  adminUserId: string,
): Promise<number> {
  return db.adminRecoveryCode.count({ where: { adminUserId, usedAt: null } });
}

export function findAdminPasswordHash(
  db: PrismaClient,
  adminUserId: string,
): Promise<{ passwordHash: string } | null> {
  return db.adminUser.findUnique({
    where: { id: adminUserId },
    select: { passwordHash: true },
  });
}

/** A new password closes every open session (decision 64). */
export async function changeAdminPassword(
  db: PrismaClient,
  adminUserId: string,
  passwordHash: string,
): Promise<void> {
  await db.adminUser.update({
    where: { id: adminUserId },
    data: { passwordHash, sessionVersion: { increment: 1 } },
  });
}

/**
 * Uses one recovery code to set a new password. The account row stays locked
 * while the code is checked and spent, so the same code cannot be used twice
 * by simultaneous requests. Always checks RECOVERY_CODE_COUNT hashes (padding
 * with a dummy one), so timing does not reveal whether the email exists.
 */
export async function resetPasswordWithRecoveryCode(
  db: PrismaClient,
  request: { email: string; code: string; newPasswordHash: string },
  now: Date,
): Promise<boolean> {
  return db.$transaction(
    async (tx) => {
      const rows = await tx.$queryRaw<{ id: string }[]>`
        SELECT "id" FROM "AdminUser" WHERE "email" = ${request.email} FOR UPDATE`;
      const adminUserId = rows[0]?.id;
      const codes = adminUserId
        ? await tx.adminRecoveryCode.findMany({
            where: { adminUserId, usedAt: null },
            select: { id: true, codeHash: true },
          })
        : [];
      const dummy = await getDummyPasswordHash();
      let matchId: string | null = null;
      for (let i = 0; i < RECOVERY_CODE_COUNT; i++) {
        const candidate = codes[i];
        const matches = await verifyPassword(
          candidate?.codeHash ?? dummy,
          request.code,
        );
        if (matches && candidate && !matchId) matchId = candidate.id;
      }
      if (!adminUserId || !matchId) return false;
      await tx.adminRecoveryCode.update({
        where: { id: matchId },
        data: { usedAt: now },
      });
      await tx.adminUser.update({
        where: { id: adminUserId },
        data: {
          passwordHash: request.newPasswordHash,
          sessionVersion: { increment: 1 },
        },
      });
      return true;
    },
    // Up to 8 argon2 checks run inside the transaction.
    { timeout: 15_000 },
  );
}
