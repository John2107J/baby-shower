import { beforeEach, describe, expect, it, vi } from "vitest";

const requireAdminMock = vi.fn();
const saveEventFromFormMock = vi.fn();

vi.mock("@/modules/auth/services/require-admin", () => ({
  requireAdmin: requireAdminMock,
}));
vi.mock("@/lib/db", () => ({ getDb: () => ({}) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/modules/event/services/event-service", () => ({
  saveEventFromForm: saveEventFromFormMock,
}));

const { saveEventAction } =
  await import("@/modules/event/services/event-actions");

const IDLE = { status: "idle" } as const;

function formWithBabyName(): FormData {
  const formData = new FormData();
  formData.set("babyName", "Bebé");
  return formData;
}

beforeEach(() => {
  vi.clearAllMocks();
  requireAdminMock.mockResolvedValue({ id: "u1", email: "a@b.co" });
});

describe("saveEventAction", () => {
  it("does not save anything when the user is not an admin", async () => {
    requireAdminMock.mockRejectedValue(new Error("REDIRECT:/admin/login"));
    await expect(saveEventAction(IDLE, new FormData())).rejects.toThrow(
      "REDIRECT",
    );
    expect(saveEventFromFormMock).not.toHaveBeenCalled();
  });

  it("returns a generic error without leaking details when saving fails", async () => {
    saveEventFromFormMock.mockRejectedValue(
      new Error("connection string postgres://secret"),
    );
    const state = await saveEventAction(IDLE, formWithBabyName());
    expect(state.status).toBe("error");
    expect(JSON.stringify(state)).not.toContain("postgres");
  });

  it("returns the submitted values with the errors so the form keeps what was typed", async () => {
    saveEventFromFormMock.mockResolvedValue({
      ok: false,
      fieldErrors: { city: "x" },
    });
    const state = await saveEventAction(IDLE, formWithBabyName());
    expect(state).toMatchObject({
      status: "invalid",
      values: { babyName: "Bebé", city: "" },
      fieldErrors: { city: "x" },
    });
  });

  it("reports success with the saved values", async () => {
    saveEventFromFormMock.mockResolvedValue({ ok: true });
    expect(await saveEventAction(IDLE, formWithBabyName())).toMatchObject({
      status: "saved",
      values: { babyName: "Bebé" },
    });
  });
});
