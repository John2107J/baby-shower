import type { InputHTMLAttributes } from "react";

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
    <label className="flex flex-col gap-1">
      <span>{label}</span>
      <input
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={
          [hintId, errorId].filter(Boolean).join(" ") || undefined
        }
        className="border-ink/40 aria-invalid:border-error border bg-white px-3 py-2"
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
