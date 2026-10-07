"use client";

import { useActionState } from "react";
import {
  loginAction,
  type LoginFormState,
} from "@/modules/auth/services/login-action";

const INITIAL_STATE: LoginFormState = { error: null };

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(
    loginAction,
    INITIAL_STATE,
  );

  return (
    <form action={formAction} className="flex w-full max-w-sm flex-col gap-4">
      <label className="flex flex-col gap-1">
        <span>Email</span>
        <input
          name="email"
          type="email"
          autoComplete="username"
          required
          className="border border-neutral-400 px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span>Contraseña</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="border border-neutral-400 px-3 py-2"
        />
      </label>
      {state.error && (
        <p role="alert" className="text-red-700">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={isPending}
        className="border border-neutral-800 px-3 py-2 disabled:opacity-50"
      >
        {isPending ? "Ingresando…" : "Ingresar"}
      </button>
    </form>
  );
}
