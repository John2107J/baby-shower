import { beforeEach, describe, expect, it, vi } from "vitest";

const requireAdminMock = vi.fn();
const service = {
  confirmContributionById: vi.fn(),
  voidContributionById: vi.fn(),
  voidClaimById: vi.fn(),
  editContributionAmount: vi.fn(),
};

vi.mock("@/modules/auth/services/require-admin", () => ({
  requireAdmin: requireAdminMock,
}));
vi.mock("@/lib/db", () => ({ getDb: () => ({}) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock(
  "@/modules/contribution/services/contribution-admin-service",
  () => service,
);

const actions =
  await import("@/modules/contribution/services/contribution-admin-actions");
const ID = "6f1c1a52-6f62-4b39-9d4c-6f0d0d3f8a10";

beforeEach(() => {
  vi.clearAllMocks();
  requireAdminMock.mockRejectedValue(new Error("REDIRECT:/admin/login"));
});

describe("contribution admin actions require an admin session", () => {
  it.each([
    ["confirm", () => actions.confirmContributionAction(ID)],
    ["void contribution", () => actions.voidContributionAction(ID)],
    ["void claim", () => actions.voidClaimAction(ID)],
    [
      "edit amount",
      () =>
        actions.editContributionAmountAction(
          ID,
          { status: "idle" },
          new FormData(),
        ),
    ],
  ])("%s", async (_name, run) => {
    await expect(run()).rejects.toThrow("REDIRECT:/admin/login");
    for (const fn of Object.values(service)) expect(fn).not.toHaveBeenCalled();
  });
});

describe("editContributionAmountAction", () => {
  beforeEach(() =>
    requireAdminMock.mockResolvedValue({ id: "u1", email: "a@b.co" }),
  );

  it.each([
    ["800", 800_00],
    ["150.000,50", 150_000_50],
    ["0", null],
    ["-5", null],
    ["abc", null],
  ])("parses %s", async (amount, expected) => {
    service.editContributionAmount.mockResolvedValue({ status: "saved" });
    const formData = new FormData();
    formData.set("amount", amount);
    await actions.editContributionAmountAction(
      ID,
      { status: "idle" },
      formData,
    );
    expect(service.editContributionAmount).toHaveBeenCalledWith(
      {},
      ID,
      expected,
    );
  });

  it("hides technical errors from the parents", async () => {
    service.editContributionAmount.mockRejectedValue(new Error("db down"));
    const formData = new FormData();
    formData.set("amount", "1000");
    expect(
      await actions.editContributionAmountAction(
        ID,
        { status: "idle" },
        formData,
      ),
    ).toEqual({ status: "error" });
  });
});
