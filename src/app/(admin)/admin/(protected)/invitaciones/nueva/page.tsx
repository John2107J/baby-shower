import type { Metadata } from "next";
import { InvitationForm } from "@/components/admin/invitations/invitation-form";
import { requireAdmin } from "@/modules/auth/services/require-admin";
import { createInvitationAction } from "@/modules/invitation/services/invitation-actions";
import { PAGE, PAGE_TITLE } from "@/components/admin/admin-ui";

export const metadata: Metadata = { title: "Nueva invitación" };

export default async function NewInvitationPage() {
  await requireAdmin();
  return (
    <section className={PAGE}>
      <h1 className={PAGE_TITLE}>Nueva invitación</h1>
      <InvitationForm
        action={createInvitationAction}
        initialNames={[]}
        submitLabel="Crear invitación"
      />
    </section>
  );
}
