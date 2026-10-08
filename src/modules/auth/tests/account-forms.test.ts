import { describe, expect, it } from "vitest";
import {
  parseChangePasswordForm,
  parseRecoveryForm,
  parseSetupForm,
} from "@/modules/auth/schemas/account-forms";

const form = (values: Record<string, string>) => {
  const formData = new FormData();
  for (const [key, value] of Object.entries(values)) formData.set(key, value);
  return formData;
};
const PASSWORD = "una-clave-larga-de-prueba";

describe("parseSetupForm", () => {
  it("normalizes the email and keeps the rest", () => {
    expect(
      parseSetupForm(
        form({
          email: " Padres@Example.com ",
          password: PASSWORD,
          confirmation: PASSWORD,
          setupCode: "x",
        }),
      ),
    ).toEqual({
      ok: true,
      data: { email: "padres@example.com", password: PASSWORD, setupCode: "x" },
    });
  });

  it.each([
    [{ email: "no-es-mail" }, "invalid_email"],
    [{ password: "corta", confirmation: "corta" }, "password_too_short"],
    [{ confirmation: "otra-clave-larga-x" }, "password_mismatch"],
  ])("rejects %j", (overrides, error) => {
    expect(
      parseSetupForm(
        form({
          email: "a@b.co",
          password: PASSWORD,
          confirmation: PASSWORD,
          setupCode: "x",
          ...overrides,
        }),
      ),
    ).toEqual({ ok: false, error });
  });
});

describe("parseRecoveryForm", () => {
  it("normalizes the code as people type it", () => {
    const parsed = parseRecoveryForm(
      form({
        email: "a@b.co",
        code: "abcde fghjk",
        password: PASSWORD,
        confirmation: PASSWORD,
      }),
    );
    expect(parsed).toMatchObject({ ok: true, data: { code: "ABCDE-FGHJK" } });
  });

  it("turns a malformed code into an empty one, answered later like a wrong code", () => {
    const parsed = parseRecoveryForm(
      form({
        email: "a@b.co",
        code: "x".repeat(500),
        password: PASSWORD,
        confirmation: PASSWORD,
      }),
    );
    expect(parsed).toMatchObject({ ok: true, data: { code: "" } });
  });
});

describe("parseChangePasswordForm", () => {
  it("needs a long enough, confirmed new password", () => {
    expect(
      parseChangePasswordForm(
        form({
          currentPassword: "x",
          password: "corta",
          confirmation: "corta",
        }),
      ),
    ).toEqual({ ok: false, error: "password_too_short" });
    expect(
      parseChangePasswordForm(
        form({
          currentPassword: "x",
          password: PASSWORD,
          confirmation: PASSWORD,
        }),
      ),
    ).toEqual({ ok: true, data: { currentPassword: "x", password: PASSWORD } });
  });
});
