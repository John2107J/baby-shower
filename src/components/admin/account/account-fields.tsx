import { MIN_PASSWORD_LENGTH } from "@/modules/auth/domain/password-rules";
import {
  BUTTON_PRIMARY,
  FIELD,
  INPUT,
  META,
} from "@/components/admin/admin-ui";

export { INPUT };
export const SUBMIT = BUTTON_PRIMARY;

export function Field({
  label,
  name,
  type = "text",
  autoComplete,
  defaultValue,
  hint,
}: {
  label: string;
  name: string;
  type?: string;
  autoComplete?: string;
  defaultValue?: string;
  hint?: string;
}) {
  return (
    <label className={FIELD}>
      <span>{label}</span>
      <input
        name={name}
        type={type}
        autoComplete={autoComplete}
        defaultValue={defaultValue}
        required
        className={INPUT}
      />
      {hint && <span className={META}>{hint}</span>}
    </label>
  );
}

export function NewPasswordFields() {
  return (
    <>
      <Field
        label="Contraseña nueva"
        name="password"
        type="password"
        autoComplete="new-password"
        hint={`Al menos ${MIN_PASSWORD_LENGTH} caracteres.`}
      />
      <Field
        label="Repetí la contraseña nueva"
        name="confirmation"
        type="password"
        autoComplete="new-password"
      />
    </>
  );
}

export function FormMessage({ text }: { text: string | null }) {
  if (!text) return null;
  return (
    <p role="alert" className="text-error">
      {text}
    </p>
  );
}
