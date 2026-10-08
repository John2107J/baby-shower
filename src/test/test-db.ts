import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

export function createTestDb(): PrismaClient {
  const connectionString = process.env["TEST_DATABASE_URL"];
  if (!connectionString) throw new Error("TEST_DATABASE_URL is required.");
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}

const TABLES = [
  "Contribution",
  "GiftClaim",
  "Gift",
  "Invitation",
  "Event",
  "AdminRecoveryCode",
  "AdminUser",
  "RateLimitBucket",
] as const;

export async function resetDatabase(db: PrismaClient): Promise<void> {
  const tableList = TABLES.map((table) => `"${table}"`).join(", ");
  await db.$executeRawUnsafe(
    `TRUNCATE TABLE ${tableList} RESTART IDENTITY CASCADE`,
  );
}
