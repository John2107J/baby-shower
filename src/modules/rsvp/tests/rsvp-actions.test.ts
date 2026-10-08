import { beforeEach, describe, expect, it, vi } from "vitest";

const submitRsvpMock = vi.fn();
vi.mock("next/headers", () => ({
  headers: async () => new Headers({ "x-real-ip": "1.2.3.4" }),
}));
vi.mock("@/lib/db", () => ({ getDb: () => ({}) }));
vi.mock("@/modules/rsvp/services/rsvp-service", () => ({
  submitRsvp: submitRsvpMock,
}));

const { submitRsvpAction } =
  await import("@/modules/rsvp/services/rsvp-actions");
const IDLE = { status: "idle" } as const;

beforeEach(() => vi.clearAllMocks());

describe("submitRsvpAction", () => {
  it("passes the client IP and the parsed answer, and reports success", async () => {
    submitRsvpMock.mockResolvedValue({
      ok: true,
      answer: { attending: true, attendees: 2 },
    });
    const formData = new FormData();
    formData.set("answer", "yes");
    formData.set("attendees", "2");
    const state = await submitRsvpAction("tok", IDLE, formData);
    expect(submitRsvpMock).toHaveBeenCalledWith(
      {},
      "tok",
      { attending: true, attendees: 2 },
      "1.2.3.4",
    );
    expect(state).toMatchObject({
      status: "saved",
      attending: true,
      attendees: 2,
    });
  });

  it("returns a generic error without internal details", async () => {
    submitRsvpMock.mockRejectedValue(
      new Error("connection to postgres failed"),
    );
    const state = await submitRsvpAction("tok", IDLE, new FormData());
    expect(state).toEqual({ status: "error" });
  });
});
