import type { Metadata } from "next";
import { InvitationForm } from "@/components/admin/invitations/invitation-form";
import { requireAdmin } from "@/modules/auth/services/require-admin";
import { createInvitationAction } from "@/modules/invitation/services/invitation-actions";

export const metadata: Metadata = { title: "Nueva invitación" };

export default async function NewInvitationPage() {
  await requireAdmin();
  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-xl">Nueva invitación</h1>
      <InvitationForm
        action={createInvitationAction}
        initialNames={[]}
        submitLabel="Crear invitación"
      />
    </section>
  );
}
