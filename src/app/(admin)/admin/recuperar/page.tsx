import type { Metadata } from "next";
import Link from "next/link";
import { RecoverPasswordForm } from "@/components/admin/account/recover-password-form";
import { ADMIN_ROUTES } from "@/lib/routes";
import { PAGE_TITLE } from "@/components/admin/admin-ui";

export const metadata: Metadata = { title: "Recuperar la contraseña" };

export default function RecoverPasswordPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 px-5 py-10">
      <h1 className={PAGE_TITLE}>Recuperar la contraseña</h1>
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
