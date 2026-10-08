"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  Field,
  FormMessage,
  NewPasswordFields,
  SUBMIT,
} from "@/components/admin/account/account-fields";
import { accountMessage } from "@/components/admin/account/account-texts";
import { RecoveryCodesList } from "@/components/admin/account/recovery-codes-list";
import { ADMIN_ROUTES } from "@/lib/routes";
import {
  type SetupAccountState,
  setupAccountAction,
} from "@/modules/auth/services/account-actions";

const IDLE: SetupAccountState = { status: "idle" };

export function SetupAccountForm() {
  const [state, formAction, isPending] = useActionState(
    setupAccountAction,
    IDLE,
  );

  if (state.status === "created") {
    return (
      <div className="flex w-full max-w-sm flex-col gap-4">
        <p>¡Listo! La cuenta del panel está creada.</p>
        <RecoveryCodesList codes={state.recoveryCodes} />
        <Link href={ADMIN_ROUTES.login} className={`${SUBMIT} text-center`}>
          Ya los guardé: ir a ingresar
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex w-full max-w-sm flex-col gap-4">
      <Field
        label="Email"
        name="email"
        type="email"
        autoComplete="username"
        defaultValue={"email" in state ? state.email : undefined}
      />
      <NewPasswordFields />
      <Field
        label="Código de alta"
        name="setupCode"
        type="password"
        autoComplete="off"
        hint="Es el valor de ADMIN_SETUP_CODE que cargaste en Vercel."
      />
      <FormMessage text={accountMessage(state.status)} />
      <button type="submit" disabled={isPending} className={SUBMIT}>
        {isPending ? "Creando…" : "Crear la cuenta"}
      </button>
    </form>
  );
}
