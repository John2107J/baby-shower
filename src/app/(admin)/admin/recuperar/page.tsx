import type { Metadata } from "next";
import Link from "next/link";
import { RecoverPasswordForm } from "@/components/admin/account/recover-password-form";
import { ADMIN_ROUTES } from "@/lib/routes";

export const metadata: Metadata = { title: "Recuperar la contraseña" };

export default function RecoverPasswordPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 p-6">
      <h1 className="text-xl">Recuperar la contraseña</h1>
      <RecoverPasswordForm />
      <Link
        href={ADMIN_ROUTES.login}
        className="text-sm underline underline-offset-4"
      >
        Volver a ingresar
      </Link>
    </main>
  );
}
