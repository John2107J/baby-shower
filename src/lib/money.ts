const CENTS_PER_PESO = 100;

/**
 * Parses a peso amount as people type it in Argentina: "150000", "150.000",
 * "150.000,50" or "150000,5". Returns integer cents, or null if invalid.
 */
export function parsePesosToCents(input: string): number | null {
  const value = input.trim().replace(/^\$\s*/, "");
  const match = /^(\d{1,3}(?:\.\d{3})+|\d+)(?:,(\d{1,2}))?$/.exec(value);
  if (!match) return null;
  const [, integerPart, decimalPart = ""] = match;
  const pesos = Number(integerPart!.replaceAll(".", ""));
  const cents = Number(decimalPart.padEnd(2, "0"));
  const total = pesos * CENTS_PER_PESO + cents;
  return Number.isSafeInteger(total) ? total : null;
}

const wholePesosFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});
const pesosWithCentsFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Formats integer cents as ARS for display: "$ 150.000" or "$ 150.000,50". */
export function formatCentsAsArs(cents: number): string {
  const formatter =
    cents % CENTS_PER_PESO === 0
      ? wholePesosFormatter
      : pesosWithCentsFormatter;
  return formatter.format(cents / CENTS_PER_PESO);
}

/** Formats cents for an editable input, e.g. 15000050 → "150000,50". */
export function centsToPesosInput(cents: number): string {
  const pesos = Math.floor(cents / CENTS_PER_PESO);
  const remainder = cents % CENTS_PER_PESO;
  return remainder === 0
    ? String(pesos)
    : `${pesos},${String(remainder).padStart(2, "0")}`;
}
