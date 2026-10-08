import { beforeEach, describe, expect, it, vi } from "vitest";

const requireAdminMock = vi.fn();
const service = {
  changePassword: vi.fn(),
  createFirstAccount: vi.fn(),
  recoverPassword: vi.fn(),
  regenerateRecoveryCodes: vi.fn(),
};

vi.mock("@/modules/auth/services/require-admin", () => ({
  requireAdmin: requireAdminMock,
}));
vi.mock("@/lib/db", () => ({ getDb: () => ({}) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("@/modules/auth/services/account-service", () => service);

const actions = await import("@/modules/auth/services/account-actions");

beforeEach(() => {
  vi.clearAllMocks();
  requireAdminMock.mockRejectedValue(new Error("REDIRECT:/admin/login"));
});

describe("panel account actions require an admin session", () => {
  it.each([
    [
      "change password",
      () => actions.changePasswordAction({ status: "idle" }, new FormData()),
    ],
    [
      "new codes",
      () =>
        actions.regenerateRecoveryCodesAction(
          { status: "idle" },
          new FormData(),
        ),
    ],
  ])("%s", async (_name, run) => {
    await expect(run()).rejects.toThrow("REDIRECT:/admin/login");
    expect(service.changePassword).not.toHaveBeenCalled();
    expect(service.regenerateRecoveryCodes).not.toHaveBeenCalled();
  });
});

describe("public account actions", () => {
  it("hide technical errors and keep the typed email", async () => {
    service.recoverPassword.mockRejectedValue(new Error("db down"));
    const formData = new FormData();
    formData.set("email", "padres@example.com");
    expect(
      await actions.recoverPasswordAction({ status: "idle" }, formData),
    ).toEqual({
      status: "error",
      email: "padres@example.com",
    });
  });

  it("never send passwords back to the browser", async () => {
    service.createFirstAccount.mockResolvedValue({
      ok: false,
      reason: "wrong_setup_code",
    });
    const formData = new FormData();
    formData.set("email", "padres@example.com");
    formData.set("password", "secreta-larga-123");
    formData.set("setupCode", "codigo-secreto-123456");
    const state = await actions.setupAccountAction(
      { status: "idle" },
      formData,
    );
    expect(JSON.stringify(state)).not.toMatch(/secreta|codigo-secreto/);
  });
});
