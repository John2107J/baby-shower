"use client";

import { useActionState } from "react";
import { AdminChangeMessage } from "@/components/admin/contributions/admin-change-message";
import { ConfirmSubmitButton } from "@/components/admin/invitations/confirm-submit-button";
import {
  type AdminChangeState,
  voidClaimAction,
} from "@/modules/contribution/services/contribution-admin-actions";

const IDLE: AdminChangeState = { status: "idle" };

export function ClaimRow({
  claim,
  giftTitle,
}: {
  claim: { id: string; names: string; createdAtLabel: string; voided: boolean };
  giftTitle: string;
}) {
  const [state, action] = useActionState(() => voidClaimAction(claim.id), IDLE);
  return (
    <li className="border-rose-soft flex flex-wrap items-center gap-x-3 gap-y-1 border-b py-2.5">
      <span
        className={`min-w-0 flex-1 break-words ${claim.voided ? "text-ink/60 line-through" : ""}`}
      >
        {claim.names}
      </span>
      {claim.voided ? (
        <span className="border-ink/20 text-ink/60 border px-2 py-0.5 text-sm">
          Anulado
        </span>
      ) : (
        <form action={action}>
          <ConfirmSubmitButton
            message={`¿Anulás que ${claim.names} lleva ${giftTitle}? La unidad vuelve a quedar libre. No se puede deshacer.`}
            className="border-ink/40 border px-3 py-1 text-sm"
          >
            Anular
          </ConfirmSubmitButton>
        </form>
      )}
      <span className="text-ink/70 w-full text-sm">
        Eligió llevarlo el {claim.createdAtLabel}
      </span>
      <AdminChangeMessage state={state} />
    </li>
  );
}
