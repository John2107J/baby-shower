import type { Metadata } from "next";
import { logoutAction } from "@/modules/auth/services/login-action";
import { requireAdmin } from "@/modules/auth/services/require-admin";

export const metadata: Metadata = { title: "Panel" };

export default async function AdminHomePage() {
  await requireAdmin();
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 p-6">
      <h1 className="text-xl">Panel de los papás</h1>
      <p>Sesión iniciada. Las secciones del panel llegan en la Fase 3.</p>
      <form action={logoutAction}>
        <button type="submit" className="border border-neutral-800 px-3 py-2">
          Cerrar sesión
        </button>
      </form>
    </main>
  );
}
