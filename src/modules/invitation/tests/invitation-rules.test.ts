import { describe, expect, it } from "vitest";
import {
  INVITATION_TOKEN_PATTERN,
  generateInvitationToken,
} from "@/modules/invitation/domain/invitation-rules";

describe("generateInvitationToken", () => {
  it("produces a URL-safe token with 256 bits of entropy", () => {
    const token = generateInvitationToken();
    expect(token).toMatch(INVITATION_TOKEN_PATTERN);
    expect(Buffer.from(token, "base64url")).toHaveLength(32);
  });

  it("never repeats across many generations", () => {
    const tokens = new Set(
      Array.from({ length: 10_000 }, generateInvitationToken),
    );
    expect(tokens.size).toBe(10_000);
  });
});
