import { describe, expect, it } from "vitest";
import { formatLogEntry, REDACTED, redact } from "@/lib/logger";

describe("redact", () => {
  it.each([
    "token",
    "invitationToken",
    "password",
    "guestName",
    "email",
    "paymentCbu",
    "paymentAlias",
    "amount",
    "streetAddress",
  ])("redacts the sensitive key %s", (key) => {
    expect(redact({ [key]: "sensitive" })[key]).toBe(REDACTED);
  });

  it("keeps non-sensitive keys", () => {
    expect(redact({ giftId: "g1", attempt: 2 })).toEqual({
      giftId: "g1",
      attempt: 2,
    });
  });
});

describe("formatLogEntry", () => {
  it("produces JSON with level, message and timestamp, without sensitive values", () => {
    const now = new Date("2026-01-01T00:00:00.000Z");
    const entry = JSON.parse(
      formatLogEntry(
        "info",
        "rsvp updated",
        { invitationToken: "abc123", count: 2 },
        now,
      ),
    );
    expect(entry).toEqual({
      time: "2026-01-01T00:00:00.000Z",
      level: "info",
      message: "rsvp updated",
      invitationToken: REDACTED,
      count: 2,
    });
  });
});
