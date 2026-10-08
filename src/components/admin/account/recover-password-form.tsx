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
import { ADMIN_ROUTES } from "@/lib/routes";
import {
  type RecoverPasswordState,
  recoverPasswordAction,
} from "@/modules/auth/services/account-actions";

const IDLE: RecoverPasswordState = { status: "idle" };

export function RecoverPasswordForm() {
  const [state, formAction, isPending] = useActionState(
    recoverPasswordAction,
    IDLE,
  );

  if (state.status === "done") {
    return (
      <div className="flex w-full max-w-sm flex-col gap-4">
        <p>
          Listo: la contraseña cambió y ese código ya no sirve. Si estabas
          conectado en otro dispositivo, vas a tener que ingresar de nuevo.
        </p>
        <Link href={ADMIN_ROUTES.login} className={`${SUBMIT} text-center`}>
          Ir a ingresar
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
      <Field
        label="Código de recuperación"
        name="code"
        autoComplete="off"
        hint="Uno de los códigos que guardaste, por ejemplo ABCDE-FGHJK."
      />
      <NewPasswordFields />
      <FormMessage text={accountMessage(state.status)} />
      <button type="submit" disabled={isPending} className={SUBMIT}>
        {isPending ? "Guardando…" : "Poner contraseña nueva"}
      </button>
    </form>
  );
}
