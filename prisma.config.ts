import { existsSync } from "node:fs";
import { defineConfig } from "prisma/config";

// The Prisma CLI does not load env files on its own. Use Node's built-in loader
// instead of adding a dotenv dependency. Real values live only in .env.local.
const LOCAL_ENV_FILE = ".env.local";
if (existsSync(LOCAL_ENV_FILE)) process.loadEnvFile(LOCAL_ENV_FILE);

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: {
    // Migrations must use a direct (non-pooled) connection on Neon.
    url: process.env["DATABASE_URL_UNPOOLED"] ?? process.env["DATABASE_URL"],
  },
});
