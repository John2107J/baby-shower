import type { Metadata } from "next";
import { LoginForm } from "@/components/admin/login-form";

export const metadata: Metadata = { title: "Ingresar al panel" };

export default function AdminLoginPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 p-6">
      <h1 className="text-xl">Panel de los papás</h1>
      <LoginForm />
    </main>
  );
}
