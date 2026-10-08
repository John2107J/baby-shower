import type { PrismaClient } from "@/generated/prisma/client";

export type AdminUserRecord = {
  id: string;
  email: string;
  passwordHash: string;
  sessionVersion: number;
};

export function findAdminUserByEmail(
  db: PrismaClient,
  email: string,
): Promise<AdminUserRecord | null> {
  return db.adminUser.findUnique({
    where: { email },
    select: { id: true, email: true, passwordHash: true, sessionVersion: true },
  });
}

/** Null when the account no longer exists. */
export async function findAdminSessionVersion(
  db: PrismaClient,
  id: string,
): Promise<number | null> {
  const user = await db.adminUser.findUnique({
    where: { id },
    select: { sessionVersion: true },
  });
  return user?.sessionVersion ?? null;
}

export async function upsertAdminUserPassword(
  db: PrismaClient,
  email: string,
  passwordHash: string,
): Promise<"created" | "updated"> {
  const existing = await db.adminUser.findUnique({
    where: { email },
    select: { id: true },
  });
  await db.adminUser.upsert({
    where: { email },
    create: { email, passwordHash },
    // A new password closes every open session (phase 7 security review).
    update: { passwordHash, sessionVersion: { increment: 1 } },
  });
  return existing ? "updated" : "created";
}
