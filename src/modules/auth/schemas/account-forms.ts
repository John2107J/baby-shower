import { z } from "zod";
import { normalizeRecoveryCode } from "@/modules/auth/domain/recovery-codes";
import { credentialsSchema } from "@/modules/auth/schemas/credentials";
import { MIN_PASSWORD_LENGTH } from "@/modules/auth/domain/password-rules";

const MAX_PASSWORD_LENGTH = 256;
const MAX_SETUP_CODE_LENGTH = 256;
const MAX_RECOVERY_INPUT_LENGTH = 32;

export type AccountFormError =
  | "invalid_email"
  | "password_too_short"
  | "password_mismatch"
  | "invalid_input";

const newPasswordFields = {
  password: z.string().max(MAX_PASSWORD_LENGTH),
  confirmation: z.string().max(MAX_PASSWORD_LENGTH),
};

function checkNewPassword(password: string, confirmation: string) {
  if (password.length < MIN_PASSWORD_LENGTH) return "password_too_short";
  if (password !== confirmation) return "password_mismatch";
  return null;
}

type Parsed<T> = { ok: true; data: T } | { ok: false; error: AccountFormError };

const text = (formData: FormData, key: string) => {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
};

export function parseSetupForm(
  formData: FormData,
): Parsed<{ email: string; password: string; setupCode: string }> {
  const email = credentialsSchema.shape.email.safeParse(
    text(formData, "email"),
  );
  if (!email.success) return { ok: false, error: "invalid_email" };
  const fields = z
    .object({
      ...newPasswordFields,
      setupCode: z.string().max(MAX_SETUP_CODE_LENGTH),
    })
    .safeParse({
      password: text(formData, "password"),
      confirmation: text(formData, "confirmation"),
      setupCode: text(formData, "setupCode"),
    });
  if (!fields.success) return { ok: false, error: "invalid_input" };
  const passwordError = checkNewPassword(
    fields.data.password,
    fields.data.confirmation,
  );
  if (passwordError) return { ok: false, error: passwordError };
  return {
    ok: true,
    data: {
      email: email.data,
      password: fields.data.password,
      setupCode: fields.data.setupCode,
    },
  };
}

export function parseRecoveryForm(
  formData: FormData,
): Parsed<{ email: string; code: string; password: string }> {
  const email = credentialsSchema.shape.email.safeParse(
    text(formData, "email"),
  );
  if (!email.success) return { ok: false, error: "invalid_email" };
  const rawCode = text(formData, "code");
  const code =
    rawCode.length <= MAX_RECOVERY_INPUT_LENGTH
      ? normalizeRecoveryCode(rawCode)
      : null;
  const fields = z.object(newPasswordFields).safeParse({
    password: text(formData, "password"),
    confirmation: text(formData, "confirmation"),
  });
  if (!fields.success) return { ok: false, error: "invalid_input" };
  const passwordError = checkNewPassword(
    fields.data.password,
    fields.data.confirmation,
  );
  if (passwordError) return { ok: false, error: passwordError };
  // A malformed code is answered later like a wrong one, after the rate limit.
  return {
    ok: true,
    data: {
      email: email.data,
      code: code ?? "",
      password: fields.data.password,
    },
  };
}

export function parseChangePasswordForm(
  formData: FormData,
): Parsed<{ currentPassword: string; password: string }> {
  const fields = z
    .object({
      ...newPasswordFields,
      currentPassword: z.string().max(MAX_PASSWORD_LENGTH),
    })
    .safeParse({
      currentPassword: text(formData, "currentPassword"),
      password: text(formData, "password"),
      confirmation: text(formData, "confirmation"),
    });
  if (!fields.success) return { ok: false, error: "invalid_input" };
  const passwordError = checkNewPassword(
    fields.data.password,
    fields.data.confirmation,
  );
  if (passwordError) return { ok: false, error: passwordError };
  return {
    ok: true,
    data: {
      currentPassword: fields.data.currentPassword,
      password: fields.data.password,
    },
  };
}

export function parseCurrentPassword(formData: FormData): string | null {
  const value = text(formData, "currentPassword");
  return value.length > 0 && value.length <= MAX_PASSWORD_LENGTH ? value : null;
}
