import type { PrismaClient } from "@/generated/prisma/client";

export type AdminUserRecord = {
  id: string;
  email: string;
  passwordHash: string;
};

export function findAdminUserByEmail(
  db: PrismaClient,
  email: string,
): Promise<AdminUserRecord | null> {
  return db.adminUser.findUnique({
    where: { email },
    select: { id: true, email: true, passwordHash: true },
  });
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
    update: { passwordHash },
  });
  return existing ? "updated" : "created";
}
