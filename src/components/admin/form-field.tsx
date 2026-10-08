import type { InputHTMLAttributes } from "react";
import { FIELD, INPUT } from "@/components/admin/admin-ui";

type FormFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  name: string;
  label: string;
  hint?: string;
  error?: string;
};

export function FormField({
  name,
  label,
  hint,
  error,
  ...inputProps
}: FormFieldProps) {
  const hintId = hint ? `${name}-hint` : undefined;
  const errorId = error ? `${name}-error` : undefined;
  return (
    <label className={FIELD}>
      <span>{label}</span>
      <input
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={
          [hintId, errorId].filter(Boolean).join(" ") || undefined
        }
        className={INPUT}
        {...inputProps}
      />
      {hint && (
        <span id={hintId} className="text-ink/70 text-sm">
          {hint}
        </span>
      )}
      {error && (
        <span id={errorId} className="text-error text-sm">
          {error}
        </span>
      )}
    </label>
  );
}
