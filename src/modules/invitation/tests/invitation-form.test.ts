import { describe, expect, it } from "vitest";
import {
  guestNamesSchema,
  readGuestNames,
} from "@/modules/invitation/schemas/invitation-form";

const parse = (names: string[]) => guestNamesSchema.safeParse(names);

describe("guestNamesSchema", () => {
  it("accepts one name", () => {
    expect(parse(["Ana", "", "", "", ""])).toMatchObject({
      success: true,
      data: ["Ana"],
    });
  });

  it("accepts five names", () => {
    const names = ["Ana", "Luis", "Sofía", "Tomás", "Mía"];
    expect(parse(names)).toMatchObject({ success: true, data: names });
  });

  it("trims names and ignores empty boxes in any position", () => {
    expect(parse(["", "  Ana  ", " ", "Luis", ""])).toMatchObject({
      success: true,
      data: ["Ana", "Luis"],
    });
  });

  it("requires at least one name", () => {
    const result = parse(["", " ", "", "", ""]);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(
      "Ingresá al menos un nombre.",
    );
  });

  it("rejects more than five names", () => {
    expect(parse(["a", "b", "c", "d", "e", "f"]).success).toBe(false);
  });

  it("rejects names longer than 60 characters", () => {
    expect(parse(["x".repeat(61)]).success).toBe(false);
  });
});

describe("readGuestNames", () => {
  it("reads only the guest name inputs and caps how many are read", () => {
    const formData = new FormData();
    for (let i = 0; i < 20; i++) formData.append("guestName", `N${i}`);
    formData.set("token", "attacker-chosen");
    expect(readGuestNames(formData)).toHaveLength(6);
  });
});
