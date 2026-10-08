"use client";

import { useActionState } from "react";
import {
  MAX_GUEST_NAMES,
  MAX_GUEST_NAME_LENGTH,
} from "@/modules/invitation/domain/invitation-rules";
import type { InvitationFormState } from "@/modules/invitation/services/invitation-actions";
import { GUEST_NAME_FIELD } from "@/modules/invitation/schemas/invitation-form";

type InvitationFormProps = {
  action: (
    state: InvitationFormState,
    formData: FormData,
  ) => Promise<InvitationFormState>;
  initialNames: string[];
  submitLabel: string;
};

const INITIAL_STATE: InvitationFormState = { status: "idle" };

export function InvitationForm({
  action,
  initialNames,
  submitLabel,
}: InvitationFormProps) {
  const [state, formAction, isPending] = useActionState(action, INITIAL_STATE);
  const names =
    state.status === "invalid" || state.status === "error"
      ? state.names
      : initialNames;

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-2">
          Nombres de quienes reciben esta invitación (de 1 a {MAX_GUEST_NAMES}).
          Una familia = una invitación.
        </legend>
        {Array.from({ length: MAX_GUEST_NAMES }, (_, index) => (
          <label key={index} className="flex flex-col gap-1">
            <span className="text-sm">Nombre {index + 1}</span>
            <input
              name={GUEST_NAME_FIELD}
              defaultValue={names[index] ?? ""}
              maxLength={MAX_GUEST_NAME_LENGTH}
              autoComplete="off"
              className="border-ink/40 border bg-white px-3 py-2"
            />
          </label>
        ))}
      </fieldset>
      <button
        type="submit"
        disabled={isPending}
        className="bg-ink text-paper px-4 py-3 disabled:opacity-50"
      >
        {isPending ? "Guardando…" : submitLabel}
      </button>
      <p role="status" aria-live="polite" className="text-error text-sm">
        {state.status === "invalid" && state.error}
        {state.status === "error" &&
          "No pudimos guardar. Intentá de nuevo en unos minutos."}
        {state.status === "not_found" && "Esta invitación ya no existe."}
      </p>
    </form>
  );
}
