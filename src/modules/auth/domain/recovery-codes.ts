import { randomInt } from "node:crypto";

/** Phase 7c: 8 one-time codes like "ABCDE-FGHJK". */
export const RECOVERY_CODE_COUNT = 8;
const GROUP_LENGTH = 5;
const GROUPS = 2;
// No look-alikes (0/O, 1/I/L): codes are copied by hand. 31 symbols ≈ 49.5 bits per code.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = GROUP_LENGTH * GROUPS;

function generateRecoveryCode(): string {
  const chars = Array.from(
    { length: CODE_LENGTH },
    () => ALPHABET[randomInt(ALPHABET.length)],
  ).join("");
  return `${chars.slice(0, GROUP_LENGTH)}-${chars.slice(GROUP_LENGTH)}`;
}

/** Codes from the CSPRNG; shown once to the parents, only their hashes are stored. */
export function generateRecoveryCodes(): string[] {
  return Array.from({ length: RECOVERY_CODE_COUNT }, generateRecoveryCode);
}

/**
 * "abcde fghjk", "ABCDE-FGHJK" and "abcdefghjk" are the same code. Returns
 * null for anything that cannot be a code, before any hashing work.
 */
export function normalizeRecoveryCode(input: string): string | null {
  const compact = input.toUpperCase().replace(/[\s-]/g, "");
  if (compact.length !== CODE_LENGTH) return null;
  if (![...compact].every((char) => ALPHABET.includes(char))) return null;
  return `${compact.slice(0, GROUP_LENGTH)}-${compact.slice(GROUP_LENGTH)}`;
}
