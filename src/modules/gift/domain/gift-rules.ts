export const MAX_GIFT_TITLE_LENGTH = 80;
export const MAX_PRODUCT_URL_LENGTH = 500;
export const MIN_GIFT_QUANTITY = 1;
export const MAX_GIFT_QUANTITY = 99;
/** Upper bound for a single price; also keeps sums far below the Int column limit. */
export const MAX_GIFT_PRICE_CENTS = 20_000_000 * 100;

export type GiftEditConstraints = {
  claimedUnits: number;
  hasContributions: boolean;
};

/** Decision 22: quantity can never go below the units guests already reserved. */
export function isQuantityAllowed(
  newQuantity: number,
  constraints: GiftEditConstraints,
): boolean {
  return newQuantity >= constraints.claimedUnits;
}
