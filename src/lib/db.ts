import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { getConfig } from "@/lib/config";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Server-only module: database credentials never reach the browser.
// Lazy so that importing it never requires DATABASE_URL at build time.
export function getDb(): PrismaClient {
  if (!globalForPrisma.prisma) {
    const adapter = new PrismaPg({
      connectionString: getConfig().DATABASE_URL,
    });
    // Reused across hot reloads in development and across invocations of a warm serverless instance.
    globalForPrisma.prisma = new PrismaClient({ adapter });
  }
  return globalForPrisma.prisma;
}
