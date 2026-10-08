/**
 * After the event: exports a summary for the parents' thank-you notes (who came,
 * what each family brought or contributed) as a CSV in exports/ (ignored by Git).
 * Read-only: it changes nothing in the database.
 *
 * Usage: npm run export:summary
 * Reads DATABASE_URL from .env.local or the environment.
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.ts";

const LOCAL_ENV_FILE = ".env.local";
const EXPORT_DIR = "exports";
const CENTS_PER_PESO = 100;

const RSVP_LABELS = {
  PENDING: "Sin respuesta",
  ATTENDING: "Vienen",
  NOT_ATTENDING: "No vienen",
} as const;
const CONTRIBUTION_LABELS = {
  DECLARED: "pendiente",
  CONFIRMED: "confirmado",
  VOIDED: "anulado",
} as const;

/** Quotes every cell; a leading =, +, - or @ is neutralized so spreadsheets never run it as a formula. */
function csvCell(value: string | number): string {
  const text = String(value);
  const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safe.replaceAll('"', '""')}"`;
}

const pesos = (cents: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(
    cents / CENTS_PER_PESO,
  );

async function main(): Promise<void> {
  if (existsSync(LOCAL_ENV_FILE)) process.loadEnvFile(LOCAL_ENV_FILE);
  const connectionString = process.env["DATABASE_URL"];
  if (!connectionString) throw new Error("DATABASE_URL no está definida.");

  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  try {
    const invitations = await db.invitation.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        guestNames: true,
        rsvpStatus: true,
        rsvpAttendeesCount: true,
        claims: {
          where: { voidedAt: null },
          select: { gift: { select: { title: true } } },
        },
        contributions: {
          where: { status: { not: "VOIDED" } },
          select: {
            amountCents: true,
            status: true,
            gift: { select: { title: true } },
          },
        },
      },
    });

    const header = ["Invitación", "Asistencia", "Personas", "Lleva", "Aportes"];
    const rows = invitations.map((invitation) => [
      invitation.guestNames.join(", "),
      RSVP_LABELS[invitation.rsvpStatus],
      invitation.rsvpAttendeesCount ?? "",
      invitation.claims.map((claim) => claim.gift.title).join("; "),
      invitation.contributions
        .map(
          (c) =>
            `${pesos(c.amountCents)} para ${c.gift.title} (${CONTRIBUTION_LABELS[c.status]})`,
        )
        .join("; "),
    ]);

    mkdirSync(EXPORT_DIR, { recursive: true });
    const file = `${EXPORT_DIR}/resumen-${new Date().toISOString().slice(0, 10)}.csv`;
    // BOM so Excel opens accents correctly.
    writeFileSync(
      file,
      "﻿" +
        [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n") +
        "\n",
    );
    process.stdout.write(
      `Resumen guardado en ${file} (${rows.length} invitaciones).\n`,
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
