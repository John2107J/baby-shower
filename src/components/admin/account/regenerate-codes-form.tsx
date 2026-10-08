"use client";

import { useActionState } from "react";
import {
  Field,
  FormMessage,
  SUBMIT,
} from "@/components/admin/account/account-fields";
import { accountMessage } from "@/components/admin/account/account-texts";
import { RecoveryCodesList } from "@/components/admin/account/recovery-codes-list";
import {
  type RecoveryCodesState,
  regenerateRecoveryCodesAction,
} from "@/modules/auth/services/account-actions";

const IDLE: RecoveryCodesState = { status: "idle" };

export function RegenerateCodesForm() {
  const [state, formAction, isPending] = useActionState(
    regenerateRecoveryCodesAction,
    IDLE,
  );

  if (state.status === "generated")
    return <RecoveryCodesList codes={state.recoveryCodes} />;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Field
        label="Contraseña actual"
        name="currentPassword"
        type="password"
        autoComplete="current-password"
        hint="Los códigos nuevos reemplazan a todos los anteriores."
      />
      <FormMessage text={accountMessage(state.status)} />
      <button
        type="submit"
        disabled={isPending}
        className={`${SUBMIT} self-start`}
      >
        {isPending ? "Generando…" : "Generar códigos nuevos"}
      </button>
    </form>
  );
}
