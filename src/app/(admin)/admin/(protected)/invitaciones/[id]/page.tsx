import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InvitationForm } from "@/components/admin/invitations/invitation-form";
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/modules/auth/services/require-admin";
import { updateInvitationAction } from "@/modules/invitation/services/invitation-actions";
import { getInvitation } from "@/modules/invitation/services/invitation-service";
import { PAGE, PAGE_TITLE } from "@/components/admin/admin-ui";

export const metadata: Metadata = { title: "Editar invitación" };

export default async function EditInvitationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const invitation = await getInvitation(getDb(), id);
  if (!invitation) notFound();
  return (
    <section className={PAGE}>
      <h1 className={PAGE_TITLE}>Editar invitación</h1>
      <p className="text-ink/70 text-sm">
        El link de esta invitación no cambia al editar los nombres.
      </p>
      <InvitationForm
        action={updateInvitationAction.bind(null, invitation.id)}
        initialNames={invitation.guestNames}
        submitLabel="Guardar cambios"
      />
    </section>
  );
}
