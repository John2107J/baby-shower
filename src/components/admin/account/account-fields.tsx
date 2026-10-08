import { MIN_PASSWORD_LENGTH } from "@/modules/auth/domain/password-rules";

export const INPUT = "border border-neutral-400 px-3 py-2";
export const SUBMIT = "border border-neutral-800 px-3 py-2 disabled:opacity-50";

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
    <label className="flex flex-col gap-1">
      <span>{label}</span>
      <input
        name={name}
        type={type}
        autoComplete={autoComplete}
        defaultValue={defaultValue}
        required
        className={INPUT}
      />
      {hint && <span className="text-ink/70 text-sm">{hint}</span>}
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
