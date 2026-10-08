const CBU_LENGTH = 22;
const FIRST_BLOCK_WEIGHTS = [7, 1, 3, 9, 7, 1, 3] as const;
const SECOND_BLOCK_WEIGHTS = [3, 9, 7, 1, 3, 9, 7, 1, 3, 9, 7, 1, 3] as const;

/** Bank alias rules (BCRA): 6 to 20 characters; letters, digits, dots and hyphens. */
export const PAYMENT_ALIAS_PATTERN = /^[A-Za-z0-9.-]{6,20}$/;

function checkDigit(digits: string, weights: readonly number[]): number {
  const sum = weights.reduce(
    (total, weight, index) => total + weight * Number(digits[index]),
    0,
  );
  return (10 - (sum % 10)) % 10;
}

/** Removes the separators people usually type ("285 0590-9..."). */
export function normalizeCbu(raw: string): string {
  return raw.replace(/[\s-]/g, "");
}

/**
 * Validates a 22-digit CBU/CVU, including both check digits, to catch typos
 * before guests transfer money to a wrong account.
 */
export function isValidCbu(cbu: string): boolean {
  if (!new RegExp(`^\\d{${CBU_LENGTH}}$`).test(cbu)) return false;
  const firstBlock = cbu.slice(0, 8);
  const secondBlock = cbu.slice(8);
  return (
    checkDigit(firstBlock, FIRST_BLOCK_WEIGHTS) === Number(firstBlock[7]) &&
    checkDigit(secondBlock, SECOND_BLOCK_WEIGHTS) === Number(secondBlock[13])
  );
}
