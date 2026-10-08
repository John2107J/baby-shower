import { MIN_PASSWORD_LENGTH } from "@/modules/auth/domain/password-rules";

/** Proposed texts for the account screens (phase 7c), pending the owner's approval. */
const MESSAGES: Record<string, string> = {
  invalid_email: "Revisá el email.",
  password_too_short: `La contraseña tiene que tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`,
  password_mismatch: "Las contraseñas no coinciden.",
  invalid_input: "Revisá los datos e intentá de nuevo.",
  wrong_setup_code: "El código de alta no es correcto.",
  closed: "La cuenta del panel ya está creada. Ingresá desde el login.",
  wrong_code:
    "El email o el código de recuperación no son correctos, o ese código ya se usó.",
  wrong_password: "La contraseña actual no es correcta.",
  rate_limited:
    "Hubo demasiados intentos. Esperá 15 minutos y volvé a intentar.",
  error: "No pudimos completarlo. Intentá de nuevo en unos minutos.",
};

export function accountMessage(status: string): string | null {
  return MESSAGES[status] ?? null;
}
