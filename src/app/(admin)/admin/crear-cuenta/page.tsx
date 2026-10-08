import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SetupAccountForm } from "@/components/admin/account/setup-account-form";
import { getDb } from "@/lib/db";
import { isAccountSetupOpen } from "@/modules/auth/services/account-service";
import { PAGE_TITLE } from "@/components/admin/admin-ui";

export const metadata: Metadata = { title: "Crear la cuenta del panel" };

/** Exists only until the single shared account is created (phase 7c, option A). */
export default async function SetupAccountPage() {
  if (!(await isAccountSetupOpen(getDb(), process.env["ADMIN_SETUP_CODE"])))
    notFound();
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 px-5 py-10">
      <h1 className={PAGE_TITLE}>Crear la cuenta del panel</h1>
      <SetupAccountForm />
    </main>
  );
}
