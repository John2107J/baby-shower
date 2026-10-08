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
  type ChangePasswordState,
  changePasswordAction,
} from "@/modules/auth/services/account-actions";

const IDLE: ChangePasswordState = { status: "idle" };

export function ChangePasswordForm() {
  const [state, formAction, isPending] = useActionState(
    changePasswordAction,
    IDLE,
  );

  // Changing the password closes every session, this one included (decision 64).
  if (state.status === "done") {
    return (
      <div className="flex flex-col gap-3">
        <p>
          Contraseña cambiada. Por seguridad se cerraron todas las sesiones:
          ingresá de nuevo con la contraseña nueva.
        </p>
        <Link href={ADMIN_ROUTES.login} className={`${SUBMIT} self-start`}>
          Ir a ingresar
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Field
        label="Contraseña actual"
        name="currentPassword"
        type="password"
        autoComplete="current-password"
      />
      <NewPasswordFields />
      <FormMessage text={accountMessage(state.status)} />
      <button
        type="submit"
        disabled={isPending}
        className={`${SUBMIT} self-start`}
      >
        {isPending ? "Guardando…" : "Cambiar contraseña"}
      </button>
    </form>
  );
}
