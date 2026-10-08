"use client";

import { useActionState } from "react";
import {
  loginAction,
  type LoginFormState,
} from "@/modules/auth/services/login-action";
import { BUTTON_PRIMARY, FIELD, INPUT } from "@/components/admin/admin-ui";

const INITIAL_STATE: LoginFormState = { error: null };

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(
    loginAction,
    INITIAL_STATE,
  );

  return (
    <form action={formAction} className="flex w-full max-w-sm flex-col gap-4">
      <label className={FIELD}>
        <span>Email</span>
        <input
          name="email"
          type="email"
          autoComplete="username"
          required
          className={INPUT}
        />
      </label>
      <label className={FIELD}>
        <span>Contraseña</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={INPUT}
        />
      </label>
      {state.error && (
        <p role="alert" className="text-red-700">
          {state.error}
        </p>
      )}
      <button type="submit" disabled={isPending} className={BUTTON_PRIMARY}>
        {isPending ? "Ingresando…" : "Ingresar"}
      </button>
    </form>
  );
}
