import { beforeEach, describe, expect, it, vi } from "vitest";

const requireAdminMock = vi.fn();
const service = {
  createInvitationFromForm: vi.fn(),
  updateInvitationFromForm: vi.fn(),
  regenerateInvitationLink: vi.fn(),
  deleteInvitation: vi.fn(),
  markInvitationAsSent: vi.fn(),
};

vi.mock("@/modules/auth/services/require-admin", () => ({
  requireAdmin: requireAdminMock,
}));
vi.mock("@/lib/db", () => ({ getDb: () => ({}) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Error(`REDIRECT:${path}`);
  },
}));
vi.mock("@/modules/invitation/services/invitation-service", () => service);

const actions =
  await import("@/modules/invitation/services/invitation-actions");
const IDLE = { status: "idle" } as const;

beforeEach(() => {
  vi.clearAllMocks();
  requireAdminMock.mockRejectedValue(new Error("REDIRECT:/admin/login"));
});

describe("invitation actions require an admin session", () => {
  it.each([
    ["create", () => actions.createInvitationAction(IDLE, new FormData())],
    [
      "update",
      () => actions.updateInvitationAction("id", IDLE, new FormData()),
    ],
    ["regenerate", () => actions.regenerateInvitationLinkAction("id")],
    ["delete", () => actions.deleteInvitationAction("id", IDLE)],
    ["mark sent", () => actions.markInvitationSentAction("id", "WHATSAPP")],
  ])("%s", async (_name, run) => {
    await expect(run()).rejects.toThrow("REDIRECT:/admin/login");
    for (const fn of Object.values(service)) expect(fn).not.toHaveBeenCalled();
  });
});

describe("with a session", () => {
  beforeEach(() =>
    requireAdminMock.mockResolvedValue({ id: "u1", email: "a@b.co" }),
  );

  it("returns the typed names with the error so the form keeps them", async () => {
    service.createInvitationFromForm.mockResolvedValue({
      ok: false,
      reason: "invalid",
      error: "x",
    });
    const formData = new FormData();
    formData.append("guestName", "Ana");
    formData.append("guestName", "");
    expect(await actions.createInvitationAction(IDLE, formData)).toEqual({
      status: "invalid",
      names: ["Ana", ""],
      error: "x",
    });
  });

  it("reports when an invitation with activity cannot be deleted", async () => {
    service.deleteInvitation.mockResolvedValue({
      ok: false,
      reason: "has_activity",
    });
    expect(await actions.deleteInvitationAction("id", IDLE)).toEqual({
      status: "has_activity",
    });
  });

  it("hides internal errors", async () => {
    service.createInvitationFromForm.mockRejectedValue(
      new Error("db password leaked?"),
    );
    const state = await actions.createInvitationAction(IDLE, new FormData());
    expect(state.status).toBe("error");
    expect(JSON.stringify(state)).not.toContain("password");
  });
});
