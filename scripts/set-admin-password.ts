/**
 * Creates the shared admin account or resets its password.
 *
 * Usage: npm run admin:set-password -- <email>
 *
 * The password is typed interactively (hidden) and never stored in files,
 * shell history or logs. Reads DATABASE_URL from .env.local or the environment.
 */
import { existsSync } from "node:fs";
import { createInterface, type Interface } from "node:readline";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.ts";
import { upsertAdminUserPassword } from "../src/modules/auth/repositories/admin-user-repository.ts";
import {
  MIN_PASSWORD_LENGTH,
  hashPassword,
} from "../src/modules/auth/services/password.ts";
import { normalizeEmail } from "../src/modules/auth/schemas/credentials.ts";

const LOCAL_ENV_FILE = ".env.local";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type MutableReadline = Interface & { _writeToOutput: (text: string) => void };

// Reads answers line by line; nothing typed is echoed to the terminal.
function createHiddenPrompt(): {
  ask: (question: string) => Promise<string>;
  close: () => void;
} {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
  }) as MutableReadline;
  rl._writeToOutput = () => {};
  const lines = rl[Symbol.asyncIterator]();
  return {
    ask: async (question) => {
      process.stdout.write(question);
      const next = await lines.next();
      process.stdout.write("\n");
      return next.done ? "" : next.value;
    },
    close: () => rl.close(),
  };
}

async function main(): Promise<void> {
  const rawEmail = process.argv[2];
  if (!rawEmail || !EMAIL_PATTERN.test(rawEmail)) {
    throw new Error("Usage: npm run admin:set-password -- <email>");
  }
  const email = normalizeEmail(rawEmail);

  const prompt = createHiddenPrompt();
  const password = await prompt.ask("Nueva contraseña: ");
  const confirmation = await prompt.ask("Repetí la contraseña: ");
  prompt.close();
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(
      `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`,
    );
  }
  if (password !== confirmation)
    throw new Error("Las contraseñas no coinciden.");

  if (existsSync(LOCAL_ENV_FILE)) process.loadEnvFile(LOCAL_ENV_FILE);
  const connectionString = process.env["DATABASE_URL"];
  if (!connectionString) throw new Error("DATABASE_URL no está definida.");

  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  try {
    const outcome = await upsertAdminUserPassword(
      db,
      email,
      await hashPassword(password),
    );
    process.stdout.write(
      outcome === "created" ? "Cuenta creada.\n" : "Contraseña actualizada.\n",
    );
  } finally {
    await db.$disconnect();
  }
}

main().catch((error: unknown) => {
  process.stderr.write(
    `${error instanceof Error ? error.message : "Error inesperado."}\n`,
  );
  process.exitCode = 1;
});
