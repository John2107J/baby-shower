import { execFileSync } from "node:child_process";

/**
 * Integration tests run against a real, disposable PostgreSQL database given by
 * TEST_DATABASE_URL (never the production database). Migrations are applied
 * before the suite starts.
 */
export default function setup(): void {
  const testDatabaseUrl = process.env["TEST_DATABASE_URL"];
  if (!testDatabaseUrl) {
    throw new Error("TEST_DATABASE_URL is required to run integration tests.");
  }
  process.env["DATABASE_URL"] = testDatabaseUrl;
  delete process.env["DATABASE_URL_UNPOOLED"];
  execFileSync("npx", ["prisma", "migrate", "deploy"], {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: testDatabaseUrl },
  });
}
