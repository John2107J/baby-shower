import { describe, expect, it } from "vitest";
import {
  PAYMENT_ALIAS_PATTERN,
  isValidCbu,
  normalizeCbu,
} from "@/modules/event/domain/payment";

// Publicly documented example CBU with valid check digits (not a real account of the parents).
const VALID_CBU = "2850590940090418135201";

describe("isValidCbu", () => {
  it("accepts a CBU with correct check digits", () => {
    expect(isValidCbu(VALID_CBU)).toBe(true);
  });

  it("rejects a wrong first-block check digit", () => {
    expect(isValidCbu("2850590840090418135201")).toBe(false);
  });

  it("rejects a wrong second-block check digit", () => {
    expect(isValidCbu("2850590940090418135202")).toBe(false);
  });

  it.each(["", "123", "28505909400904181352011", "28505909400904181352a1"])(
    "rejects malformed input %j",
    (value) => {
      expect(isValidCbu(value)).toBe(false);
    },
  );
});

describe("normalizeCbu", () => {
  it("removes spaces and hyphens", () => {
    expect(normalizeCbu(" 2850590-9 4009041813 5201 ")).toBe(VALID_CBU);
  });
});

describe("PAYMENT_ALIAS_PATTERN", () => {
  it.each(["mi.alias.mp", "ALIAS-123", "abcdef"])("accepts %j", (alias) => {
    expect(PAYMENT_ALIAS_PATTERN.test(alias)).toBe(true);
  });

  it.each(["abc", "a".repeat(21), "con espacio", "ñandú.alias"])(
    "rejects %j",
    (alias) => {
      expect(PAYMENT_ALIAS_PATTERN.test(alias)).toBe(false);
    },
  );
});
