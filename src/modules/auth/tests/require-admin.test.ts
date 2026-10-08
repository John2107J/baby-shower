import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
const redirectMock = vi.fn((path: string) => {
  throw new Error(`REDIRECT:${path}`);
});

vi.mock("@/modules/auth/auth", () => ({
  ADMIN_LOGIN_PATH: "/admin/login",
  auth: authMock,
}));
const findVersionMock = vi.fn();

vi.mock("next/navigation", () => ({ redirect: redirectMock }));
vi.mock("@/lib/db", () => ({ getDb: () => ({}) }));
vi.mock("@/modules/auth/repositories/admin-user-repository", () => ({
  findAdminSessionVersion: findVersionMock,
}));

const { requireAdmin } = await import("@/modules/auth/services/require-admin");

beforeEach(() => vi.clearAllMocks());

describe("requireAdmin", () => {
  it("redirects to the login page when there is no session", async () => {
    authMock.mockResolvedValue(null);
    await expect(requireAdmin()).rejects.toThrow("REDIRECT:/admin/login");
  });

  it("redirects when the session has no user id", async () => {
    authMock.mockResolvedValue({ user: { email: "padres@example.com" } });
    await expect(requireAdmin()).rejects.toThrow("REDIRECT:/admin/login");
  });

  it("rejects sessions opened before the last password change", async () => {
    authMock.mockResolvedValue({
      user: { id: "u1", email: "padres@example.com", sessionVersion: 0 },
    });
    findVersionMock.mockResolvedValue(1);
    await expect(requireAdmin()).rejects.toThrow("REDIRECT:/admin/login");
  });

  it("rejects sessions without a version (opened before this change) or of deleted accounts", async () => {
    authMock.mockResolvedValue({
      user: { id: "u1", email: "padres@example.com" },
    });
    findVersionMock.mockResolvedValue(0);
    await expect(requireAdmin()).rejects.toThrow("REDIRECT:/admin/login");
    authMock.mockResolvedValue({
      user: { id: "u1", email: "padres@example.com", sessionVersion: 0 },
    });
    findVersionMock.mockResolvedValue(null);
    await expect(requireAdmin()).rejects.toThrow("REDIRECT:/admin/login");
  });

  it("returns the admin when the session is valid", async () => {
    authMock.mockResolvedValue({
      user: { id: "u1", email: "padres@example.com", sessionVersion: 2 },
    });
    findVersionMock.mockResolvedValue(2);
    await expect(requireAdmin()).resolves.toEqual({
      id: "u1",
      email: "padres@example.com",
    });
    expect(redirectMock).not.toHaveBeenCalled();
  });
});
