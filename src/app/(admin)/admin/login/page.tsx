import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/admin/login-form";
import { ADMIN_ROUTES } from "@/lib/routes";
import { PAGE_TITLE } from "@/components/admin/admin-ui";

export const metadata: Metadata = { title: "Ingresar al panel" };

export default function AdminLoginPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 px-5 py-10">
      <h1 className={PAGE_TITLE}>Panel de los papás</h1>
      <LoginForm />
      <Link
        href={ADMIN_ROUTES.recoverPassword}
        className="text-sm underline underline-offset-4"
      >
        ¿Olvidaste tu contraseña?
      </Link>
    </main>
  );
}
