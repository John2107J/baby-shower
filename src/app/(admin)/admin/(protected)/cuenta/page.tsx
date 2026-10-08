import type { Metadata } from "next";
import { ChangePasswordForm } from "@/components/admin/account/change-password-form";
import { RegenerateCodesForm } from "@/components/admin/account/regenerate-codes-form";
import { getDb } from "@/lib/db";
import { getRemainingRecoveryCodes } from "@/modules/auth/services/account-service";
import { requireAdmin } from "@/modules/auth/services/require-admin";

export const metadata: Metadata = { title: "Cuenta" };

export default async function AccountPage() {
  const admin = await requireAdmin();
  const remaining = await getRemainingRecoveryCodes(getDb(), admin.id);
  return (
    <section className="flex flex-col gap-8">
      <h1 className="text-xl">Cuenta</h1>
      <p className="text-ink/70 text-sm">Ingresaste como {admin.email}.</p>

      <div className="flex flex-col gap-3">
        <h2 className="text-lg">Códigos de recuperación</h2>
        <p>
          {remaining === 0
            ? "No tenés códigos de recuperación. Generalos y guardalos: son la única forma de recuperar la contraseña si te la olvidás."
            : `Te quedan ${remaining} ${remaining === 1 ? "código" : "códigos"} sin usar.`}
        </p>
        <RegenerateCodesForm />
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-lg">Cambiar la contraseña</h2>
        <ChangePasswordForm />
      </div>
    </section>
  );
}
