import type { ReactNode } from "react";
import { AdminNav } from "@/components/admin/admin-nav";
import { requireAdmin } from "@/modules/auth/services/require-admin";

export default async function ProtectedAdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAdmin();
  return (
    <>
      <AdminNav />
      <main className="mx-auto max-w-xl px-4 py-6">{children}</main>
    </>
  );
}
