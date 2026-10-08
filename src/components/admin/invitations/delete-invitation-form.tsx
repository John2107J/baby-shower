"use client";

import { useActionState } from "react";
import { ConfirmSubmitButton } from "@/components/admin/invitations/confirm-submit-button";
import {
  type InvitationRowState,
  deleteInvitationAction,
} from "@/modules/invitation/services/invitation-actions";

const INITIAL_STATE: InvitationRowState = { status: "idle" };

export function DeleteInvitationForm({
  invitationId,
  className,
}: {
  invitationId: string;
  className: string;
}) {
  const [state, formAction] = useActionState(
    deleteInvitationAction.bind(null, invitationId),
    INITIAL_STATE,
  );
  return (
    <form action={formAction} className="flex flex-col gap-1">
      <ConfirmSubmitButton
        message="¿Borrar esta invitación? No se puede deshacer."
        className={className}
      >
        Borrar
      </ConfirmSubmitButton>
      {state.status === "has_activity" && (
        <span role="alert" className="text-error text-sm">
          Ya tiene respuesta, reservas o aportes: no se puede borrar.
        </span>
      )}
      {state.status === "error" && (
        <span role="alert" className="text-error text-sm">
          No pudimos borrarla. Intentá de nuevo.
        </span>
      )}
    </form>
  );
}
