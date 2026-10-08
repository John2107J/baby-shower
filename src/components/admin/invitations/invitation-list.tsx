import Link from "next/link";
import { ConfirmSubmitButton } from "@/components/admin/invitations/confirm-submit-button";
import { CopyLinkButton } from "@/components/admin/invitations/copy-link-button";
import { DeleteInvitationForm } from "@/components/admin/invitations/delete-invitation-form";
import { ShareButtons } from "@/components/admin/invitations/share-buttons";
import { ADMIN_ROUTES } from "@/lib/routes";
import type { AdminInvitationView } from "@/modules/invitation/dto/invitation-admin-dto";
import { regenerateInvitationLinkAction } from "@/modules/invitation/services/invitation-actions";

const SMALL_BUTTON = "border border-ink/40 px-3 py-1 text-sm";

function InvitationRow({ invitation }: { invitation: AdminInvitationView }) {
  const names = invitation.guestNames.join(", ");
  return (
    <li className="border-rose-soft flex flex-col gap-2 border-b py-4">
      <p className="font-medium break-words">{names}</p>
      <p className="text-ink/70 text-sm">
        {invitation.rsvpLabel}
        {" · "}
        {invitation.sentLabel ?? "Sin enviar"}
      </p>
      <p className="text-sm break-all select-all">{invitation.link}</p>
      <div className="flex flex-wrap items-start gap-2">
        <CopyLinkButton
          link={invitation.link}
          label={`Copiar link de ${names}`}
        />
        {invitation.share && (
          <ShareButtons
            invitationId={invitation.id}
            share={invitation.share}
            names={names}
          />
        )}
        <Link
          href={ADMIN_ROUTES.editInvitation(invitation.id)}
          className={SMALL_BUTTON}
        >
          Editar
        </Link>
        <form action={regenerateInvitationLinkAction.bind(null, invitation.id)}>
          <ConfirmSubmitButton
            message="Se va a crear un link nuevo y el anterior va a dejar de funcionar. ¿Continuar?"
            className={SMALL_BUTTON}
          >
            Regenerar link
          </ConfirmSubmitButton>
        </form>
        {invitation.canDelete && (
          <DeleteInvitationForm
            invitationId={invitation.id}
            className={SMALL_BUTTON}
          />
        )}
      </div>
    </li>
  );
}

export function InvitationList({
  invitations,
}: {
  invitations: AdminInvitationView[];
}) {
  if (invitations.length === 0) return <p>Todavía no hay invitaciones.</p>;
  return (
    <ul>
      {invitations.map((invitation) => (
        <InvitationRow key={invitation.id} invitation={invitation} />
      ))}
    </ul>
  );
}
