import { describe, expect, it } from "vitest";
import {
  centsToPesosInput,
  formatCentsAsArs,
  parsePesosToCents,
} from "@/lib/money";

describe("parsePesosToCents", () => {
  it.each([
    ["150000", 15_000_000],
    ["150.000", 15_000_000],
    ["150.000,50", 15_000_050],
    ["150000,5", 15_000_050],
    ["$ 1.500", 150_000],
    [" 99 ", 9_900],
    ["1.234.567", 123_456_700],
  ])("parses %j", (input, cents) => {
    expect(parsePesosToCents(input)).toBe(cents);
  });

  it.each([
    "",
    "abc",
    "-100",
    "1,234.56",
    "150.00",
    "1.50,00",
    "10,123",
    "1e5",
    "15 000",
  ])("rejects %j", (input) => {
    expect(parsePesosToCents(input)).toBeNull();
  });
});

describe("formatting", () => {
  it("formats cents as ARS for display", () => {
    expect(formatCentsAsArs(15_000_050).replace(/\s/g, " ")).toBe(
      "$ 150.000,50",
    );
    expect(formatCentsAsArs(15_000_000).replace(/\s/g, " ")).toBe("$ 150.000");
  });

  it("round-trips the editable input format", () => {
    for (const cents of [100, 15_000_000, 15_000_050, 15_000_005]) {
      expect(parsePesosToCents(centsToPesosInput(cents))).toBe(cents);
    }
  });
});
