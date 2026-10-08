/** Decision 42: smallest contribution a guest can declare ($1.000). */
export const MIN_CONTRIBUTION_CENTS = 1_000 * 100;

export type GiftCommitments = {
  quantity: number;
  unitPriceCents: number;
  /** Active "Yo lo llevo" units (voided ones excluded). */
  claimedUnits: number;
  /** Money confirmed by the parents (decision 41). */
  confirmedCents: number;
  /** Money declared by guests and not yet confirmed or voided. */
  pendingCents: number;
};

export type GiftProgress =
  | { state: "complete" }
  | {
      /** "open": guests can still act; "awaiting_confirmation": pending money covers the rest (decision 2 of phase 5). */
      state: "open" | "awaiting_confirmation";
      /** 1-based unit the bar is filling (decision 39). */
      currentUnit: number;
      /** Confirmed money inside the current unit. */
      currentUnitPaidCents: number;
      currentUnitMissingCents: number;
      canClaim: boolean;
      /** Largest amount a guest may declare now (decision 42); 0 when nothing is left. */
      maxContributionCents: number;
    };

/**
 * Progress of one gift, per unit:
 * - total to cover = quantity × unit price (decision 38);
 * - each "Yo lo llevo" covers one whole unit; confirmed money fills the
 *   remaining units one after another (decisions 39 and 40);
 * - only confirmed money moves the bar (decision 41), but confirmed and
 *   pending money both reduce what can still be declared (decision 42) and
 *   both make a unit unavailable for "Yo lo llevo" (decision 40, owner's
 *   answer 1 in phase 5).
 */
export function computeGiftProgress(gift: GiftCommitments): GiftProgress {
  const { quantity, unitPriceCents: price, claimedUnits } = gift;
  const unitsForMoney = Math.max(0, quantity - claimedUnits);
  const confirmed = Math.min(gift.confirmedCents, unitsForMoney * price);

  if (claimedUnits * price + confirmed >= quantity * price)
    return { state: "complete" };

  const unitsFullyPaid = Math.floor(confirmed / price);
  const currentUnitPaidCents = confirmed - unitsFullyPaid * price;
  const committedMoney = gift.confirmedCents + gift.pendingCents;
  const unitsTouchedByMoney = Math.ceil(committedMoney / price);
  const maxContributionCents = Math.max(
    0,
    unitsForMoney * price - committedMoney,
  );

  return {
    state: maxContributionCents > 0 ? "open" : "awaiting_confirmation",
    currentUnit: claimedUnits + unitsFullyPaid + 1,
    currentUnitPaidCents,
    currentUnitMissingCents: price - currentUnitPaidCents,
    canClaim: unitsForMoney - unitsTouchedByMoney >= 1,
    maxContributionCents,
  };
}

export type ContributionCheck =
  | { ok: true }
  | { ok: false; reason: "below_minimum" | "above_maximum" | "nothing_left" };

/**
 * Decision 42: between $1.000 and what is left. When less than $1.000 is
 * left, the exact remainder is accepted so the gift can still be completed.
 */
export function checkContributionAmount(
  amountCents: number,
  progress: GiftProgress,
): ContributionCheck {
  if (progress.state !== "open") return { ok: false, reason: "nothing_left" };
  const max = progress.maxContributionCents;
  const min = Math.min(MIN_CONTRIBUTION_CENTS, max);
  if (amountCents < min) return { ok: false, reason: "below_minimum" };
  if (amountCents > max) return { ok: false, reason: "above_maximum" };
  return { ok: true };
}

/**
 * Decision 51 and owner's answer 1 in phase 5b: the parents may set any
 * positive amount (no $1.000 minimum), up to what the gift still needs
 * without counting the contribution being edited.
 */
export function maxAmountForEdit(othersOnly: GiftCommitments): number {
  const progress = computeGiftProgress(othersOnly);
  return progress.state === "complete" ? 0 : progress.maxContributionCents;
}
