import { describe, expect, it } from "vitest";
import { getClientIp } from "@/lib/client-ip";

describe("getClientIp", () => {
  it("prefers x-real-ip", () => {
    const headers = new Headers({
      "x-real-ip": "1.1.1.1",
      "x-forwarded-for": "2.2.2.2",
    });
    expect(getClientIp(headers)).toBe("1.1.1.1");
  });

  it("falls back to the first x-forwarded-for entry", () => {
    expect(
      getClientIp(new Headers({ "x-forwarded-for": "2.2.2.2, 3.3.3.3" })),
    ).toBe("2.2.2.2");
  });

  it("returns 'unknown' when no header is present", () => {
    expect(getClientIp(new Headers())).toBe("unknown");
  });
});
