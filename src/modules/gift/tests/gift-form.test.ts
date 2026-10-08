import { describe, expect, it } from "vitest";
import { giftFormSchema, readGiftForm } from "@/modules/gift/schemas/gift-form";

const VALID = {
  title: "Cochecito",
  productUrl: "https://tienda.example.com/cochecito",
  referencePrice: "150.000",
  quantity: "2",
};

const errorField = (overrides: Partial<typeof VALID>) => {
  const result = giftFormSchema.safeParse({ ...VALID, ...overrides });
  return result.success ? null : result.error.issues[0]?.path[0];
};

describe("giftFormSchema", () => {
  it("parses a valid gift into cents and an integer quantity", () => {
    expect(giftFormSchema.parse(VALID)).toEqual({
      title: "Cochecito",
      productUrl: "https://tienda.example.com/cochecito",
      referencePrice: 15_000_000,
      quantity: 2,
    });
  });

  it.each([
    ["title", ""],
    ["title", "x".repeat(81)],
    ["productUrl", "javascript:alert(1)"],
    ["productUrl", "tienda.com"],
    ["referencePrice", "0"],
    ["referencePrice", "-5"],
    ["referencePrice", "20.000.001"],
    ["quantity", "0"],
    ["quantity", "100"],
    ["quantity", "1.5"],
  ] as const)("rejects an invalid %s (%j)", (field, value) => {
    expect(errorField({ [field]: value })).toBe(field);
  });
});

describe("readGiftForm", () => {
  it("treats an empty file input as no image", () => {
    const formData = new FormData();
    formData.set("image", new File([], ""));
    expect(readGiftForm(formData).image).toBeNull();
  });
});
