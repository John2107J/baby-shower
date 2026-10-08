import { beforeEach, describe, expect, it, vi } from "vitest";

const requireAdminMock = vi.fn();
const service = {
  createGiftFromForm: vi.fn(),
  updateGiftFromForm: vi.fn(),
  archiveGift: vi.fn(),
  reorderGift: vi.fn(),
};

vi.mock("@/modules/auth/services/require-admin", () => ({
  requireAdmin: requireAdminMock,
}));
vi.mock("@/lib/db", () => ({ getDb: () => ({}) }));
vi.mock("@/lib/image-storage", () => ({ getImageStorage: () => ({}) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Error(`REDIRECT:${path}`);
  },
}));
vi.mock("@/modules/gift/services/gift-service", () => service);

const actions = await import("@/modules/gift/services/gift-actions");
const IDLE = { status: "idle" } as const;

beforeEach(() => {
  vi.clearAllMocks();
  requireAdminMock.mockRejectedValue(new Error("REDIRECT:/admin/login"));
});

describe("gift actions require an admin session", () => {
  it.each([
    ["createGiftAction", () => actions.createGiftAction(IDLE, new FormData())],
    [
      "updateGiftAction",
      () => actions.updateGiftAction("id", IDLE, new FormData()),
    ],
    ["setGiftArchivedAction", () => actions.setGiftArchivedAction("id", true)],
    ["moveGiftAction", () => actions.moveGiftAction("id", "up")],
  ])("%s", async (_name, run) => {
    await expect(run()).rejects.toThrow("REDIRECT:/admin/login");
    for (const fn of Object.values(service)) expect(fn).not.toHaveBeenCalled();
  });
});

describe("createGiftAction", () => {
  beforeEach(() =>
    requireAdminMock.mockResolvedValue({ id: "u1", email: "a@b.co" }),
  );

  it("returns values and asks to re-pick the photo when validation fails", async () => {
    service.createGiftFromForm.mockResolvedValue({
      ok: false,
      reason: "invalid",
      fieldErrors: { title: "x" },
    });
    const formData = new FormData();
    formData.set("title", "");
    formData.set("image", new File([new Uint8Array([1])], "a.jpg"));
    expect(await actions.createGiftAction(IDLE, formData)).toMatchObject({
      status: "invalid",
      hadImage: true,
      fieldErrors: { title: "x" },
    });
  });

  it("redirects to the list after saving", async () => {
    service.createGiftFromForm.mockResolvedValue({ ok: true, id: "g1" });
    await expect(
      actions.createGiftAction(IDLE, new FormData()),
    ).rejects.toThrow("REDIRECT:/admin/regalos");
  });

  it("hides internal errors", async () => {
    service.createGiftFromForm.mockRejectedValue(new Error("blob token xyz"));
    const state = await actions.createGiftAction(IDLE, new FormData());
    expect(state.status).toBe("error");
    expect(JSON.stringify(state)).not.toContain("xyz");
  });
});
