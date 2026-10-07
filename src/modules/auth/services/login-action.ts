"use server";

import { AuthError, CredentialsSignin } from "next-auth";
import {
  ADMIN_HOME_PATH,
  ADMIN_LOGIN_PATH,
  RATE_LIMITED_CODE,
  signIn,
  signOut,
} from "@/modules/auth/auth";

export type LoginFormState = { error: string | null };

const INVALID_CREDENTIALS_MESSAGE =
  "El email o la contraseña no son correctos.";
const RATE_LIMITED_MESSAGE =
  "Hubo demasiados intentos fallidos. Esperá 15 minutos y volvé a intentar.";
const UNEXPECTED_ERROR_MESSAGE =
  "No pudimos iniciar sesión. Intentá de nuevo en unos minutos.";

export async function loginAction(
  _previousState: LoginFormState,
  formData: FormData,
): Promise<LoginFormState> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: ADMIN_HOME_PATH,
    });
    return { error: null };
  } catch (error) {
    // A successful sign-in throws Next's redirect, which must propagate.
    if (!(error instanceof AuthError)) throw error;
    if (error instanceof CredentialsSignin) {
      return {
        error:
          error.code === RATE_LIMITED_CODE
            ? RATE_LIMITED_MESSAGE
            : INVALID_CREDENTIALS_MESSAGE,
      };
    }
    return { error: UNEXPECTED_ERROR_MESSAGE };
  }
}

export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: ADMIN_LOGIN_PATH });
}
