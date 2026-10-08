import { describe, expect, it } from "vitest";
import {
  eventFormSchema,
  readEventForm,
} from "@/modules/event/schemas/event-form";
import { VALID_EVENT_FORM } from "@/modules/event/tests/fixtures";

const parse = (overrides: Partial<typeof VALID_EVENT_FORM>) =>
  eventFormSchema.safeParse({ ...VALID_EVENT_FORM, ...overrides });

const firstErrorPath = (overrides: Partial<typeof VALID_EVENT_FORM>) => {
  const result = parse(overrides);
  return result.success ? null : result.error.issues[0]?.path[0];
};

describe("eventFormSchema", () => {
  it("accepts a complete valid form", () => {
    expect(parse({}).success).toBe(true);
  });

  it("turns empty optional fields into null", () => {
    const result = parse({ venueName: "  ", mapsUrl: "", paymentCbu: "" });
    expect(result.success && result.data).toMatchObject({
      venueName: null,
      mapsUrl: null,
      paymentCbu: null,
    });
  });

  it("normalizes the CBU", () => {
    const result = parse({ paymentCbu: "2850590-9 40090418135201" });
    expect(result.success && result.data.paymentCbu).toBe(
      "2850590940090418135201",
    );
  });

  it("requires at least an alias or a CBU", () => {
    expect(firstErrorPath({ paymentAlias: "", paymentCbu: "" })).toBe(
      "paymentAlias",
    );
  });

  it("accepts only an alias or only a CBU", () => {
    expect(parse({ paymentCbu: "" }).success).toBe(true);
    expect(parse({ paymentAlias: "" }).success).toBe(true);
  });

  it.each([
    ["babyName", ""],
    ["streetAddress", "   "],
    ["city", ""],
    ["paymentHolderName", ""],
    ["eventDate", "15/01/2030"],
    ["eventTime", "25:00"],
    ["mapsUrl", "javascript:alert(1)"],
    ["mapsUrl", "ftp://example.com"],
    ["paymentCbu", "1234567890123456789012"],
    ["paymentAlias", "ab"],
    ["babyName", "x".repeat(61)],
  ] as const)("rejects an invalid %s (%j)", (field, value) => {
    expect(firstErrorPath({ [field]: value })).toBe(field);
  });
});

describe("readEventForm", () => {
  it("reads only known fields and ignores the rest", () => {
    const formData = new FormData();
    formData.set("babyName", "Bebé");
    formData.set("isAdmin", "true");
    const values = readEventForm(formData);
    expect(values.babyName).toBe("Bebé");
    expect(values.city).toBe("");
    expect("isAdmin" in values).toBe(false);
  });
});
