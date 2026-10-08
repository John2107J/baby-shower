import { describe, expect, it } from "vitest";
import {
  MIN_CONTRIBUTION_CENTS,
  checkContributionAmount,
  computeGiftProgress,
} from "@/modules/contribution/domain/gift-progress";

const P = 100_000_00; // $100.000 per unit
const gift = (overrides: Partial<Parameters<typeof computeGiftProgress>[0]>) =>
  computeGiftProgress({
    quantity: 2,
    unitPriceCents: P,
    claimedUnits: 0,
    confirmedCents: 0,
    pendingCents: 0,
    ...overrides,
  });

describe("computeGiftProgress (owner's example: 2 × $100.000)", () => {
  it("starts on unit 1 with everything missing", () => {
    expect(gift({})).toEqual({
      state: "open",
      currentUnit: 1,
      currentUnitPaidCents: 0,
      currentUnitMissingCents: P,
      canClaim: true,
      maxContributionCents: 2 * P,
    });
  });

  it("after $130.000 confirmed the bar restarts on unit 2 at 30%", () => {
    expect(gift({ confirmedCents: 130_000_00 })).toMatchObject({
      state: "open",
      currentUnit: 2,
      currentUnitPaidCents: 30_000_00,
      currentUnitMissingCents: 70_000_00,
      maxContributionCents: 70_000_00,
    });
  });

  it("a 'Yo lo llevo' covers a whole unit and the bar moves to the next one", () => {
    expect(gift({ claimedUnits: 1 })).toMatchObject({
      currentUnit: 2,
      currentUnitMissingCents: P,
      canClaim: true,
      maxContributionCents: P,
    });
  });

  it("is complete when claims and confirmed money cover every unit", () => {
    expect(gift({ claimedUnits: 2 })).toEqual({ state: "complete" });
    expect(gift({ confirmedCents: 2 * P })).toEqual({ state: "complete" });
    expect(gift({ claimedUnits: 1, confirmedCents: P })).toEqual({
      state: "complete",
    });
  });
});

describe("'Yo lo llevo' availability (decision 40)", () => {
  it("is blocked for a unit that already has money, even if only pending", () => {
    const g = { quantity: 1, unitPriceCents: P, claimedUnits: 0 };
    expect(
      computeGiftProgress({ ...g, confirmedCents: 1_000_00, pendingCents: 0 }),
    ).toMatchObject({ canClaim: false });
    expect(
      computeGiftProgress({ ...g, confirmedCents: 0, pendingCents: 1_000_00 }),
    ).toMatchObject({ canClaim: false });
  });

  it("stays available while at least one whole unit has no money", () => {
    expect(gift({ pendingCents: 30_000_00 })).toMatchObject({ canClaim: true });
    expect(gift({ confirmedCents: P, pendingCents: 1_00 })).toMatchObject({
      canClaim: false,
    });
    expect(gift({ quantity: 3, confirmedCents: 130_000_00 })).toMatchObject({
      canClaim: true,
    });
  });
});

describe("pending money (decisions 41 and 42)", () => {
  it("does not move the bar but reduces what can still be declared", () => {
    expect(gift({ quantity: 1, pendingCents: 40_000_00 })).toMatchObject({
      state: "open",
      currentUnitPaidCents: 0,
      maxContributionCents: 60_000_00,
    });
  });

  it("waits for confirmation when pending money covers the rest", () => {
    expect(
      gift({ quantity: 1, confirmedCents: 50_000_00, pendingCents: 50_000_00 }),
    ).toMatchObject({
      state: "awaiting_confirmation",
      currentUnitPaidCents: 50_000_00,
      canClaim: false,
      maxContributionCents: 0,
    });
  });
});

describe("checkContributionAmount", () => {
  const open = gift({ quantity: 1, confirmedCents: 99_500_00 }); // $500 left

  it("accepts amounts between $1.000 and what is left", () => {
    const g = gift({});
    expect(checkContributionAmount(MIN_CONTRIBUTION_CENTS, g)).toEqual({
      ok: true,
    });
    expect(checkContributionAmount(2 * P, g)).toEqual({ ok: true });
  });

  it.each([0, -100, MIN_CONTRIBUTION_CENTS - 1])(
    "rejects %i as below the minimum",
    (amount) => {
      expect(checkContributionAmount(amount, gift({}))).toEqual({
        ok: false,
        reason: "below_minimum",
      });
    },
  );

  it("rejects more than what is left", () => {
    expect(checkContributionAmount(2 * P + 1, gift({}))).toEqual({
      ok: false,
      reason: "above_maximum",
    });
  });

  it("accepts the exact remainder when less than $1.000 is left", () => {
    expect(checkContributionAmount(500_00, open)).toEqual({ ok: true });
    expect(checkContributionAmount(400_00, open)).toEqual({
      ok: false,
      reason: "below_minimum",
    });
  });

  it("rejects any amount when nothing is left", () => {
    expect(
      checkContributionAmount(
        MIN_CONTRIBUTION_CENTS,
        gift({ claimedUnits: 2 }),
      ),
    ).toEqual({
      ok: false,
      reason: "nothing_left",
    });
  });
});
