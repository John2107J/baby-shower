import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/admin/login-form";
import { ADMIN_ROUTES } from "@/lib/routes";

export const metadata: Metadata = { title: "Ingresar al panel" };

export default function AdminLoginPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 p-6">
      <h1 className="text-xl">Panel de los papás</h1>
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
