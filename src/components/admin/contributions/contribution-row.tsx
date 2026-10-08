"use client";

import { useActionState, useState } from "react";
import { AdminChangeMessage } from "@/components/admin/contributions/admin-change-message";
import { ConfirmSubmitButton } from "@/components/admin/invitations/confirm-submit-button";
import { formatCentsAsArs } from "@/lib/money";
import type { AdminContributionItem } from "@/modules/contribution/dto/contribution-admin-dto";
import {
  type AdminChangeState,
  confirmContributionAction,
  editContributionAmountAction,
  voidContributionAction,
} from "@/modules/contribution/services/contribution-admin-actions";
import { BUTTON_SECONDARY } from "@/components/admin/admin-ui";

const IDLE: AdminChangeState = { status: "idle" };
const SMALL_BUTTON = BUTTON_SECONDARY;
const STATUS_STYLE = {
  pending: "border-ink/40 text-ink",
  confirmed: "border-rose bg-rose text-paper",
  voided: "border-ink/20 text-ink/60 line-through",
} as const;

export function ContributionRow({ item }: { item: AdminContributionItem }) {
  const [confirmState, confirmAction] = useActionState(
    () => confirmContributionAction(item.id),
    IDLE,
  );
  const [voidState, voidAction] = useActionState(
    () => voidContributionAction(item.id),
    IDLE,
  );
  const [editState, editAction, saving] = useActionState(
    editContributionAmountAction.bind(null, item.id),
    IDLE,
  );
  const [editing, setEditing] = useState(false);
  const [amount, setAmount] = useState(item.amountInput);

  // Close the editor once per saved result (state adjusted during render, as React recommends).
  const [handledEdit, setHandledEdit] = useState(editState);
  if (editState !== handledEdit) {
    setHandledEdit(editState);
    if (editState.status === "saved" || editState.status === "unchanged")
      setEditing(false);
  }
  const showEditor = editing;
  const active = item.status !== "voided";

  return (
    <li className="border-rose-soft flex flex-wrap items-center gap-x-3 gap-y-2.5 border-b py-5">
      <span className="min-w-0 flex-1 break-words">{item.names}</span>
      <span className="tabular-nums">{item.amountLabel}</span>
      <span
        className={`border px-2 py-0.5 text-sm whitespace-nowrap ${STATUS_STYLE[item.status]}`}
      >
        {item.statusLabel}
      </span>
      <span className="text-ink/70 w-full text-sm">
        {item.giftTitle}
        {item.giftArchived && " (regalo archivado)"} · {item.createdAtLabel}
      </span>

      {active && !showEditor && (
        <div className="flex flex-wrap gap-2.5">
          {item.status === "pending" && (
            <form action={confirmAction}>
              <ConfirmSubmitButton
                message={`¿Confirmás que llegó el aporte de ${item.amountLabel} de ${item.names}?`}
                className={SMALL_BUTTON}
              >
                Confirmar
              </ConfirmSubmitButton>
            </form>
          )}
          <button
            type="button"
            onClick={() => {
              setAmount(item.amountInput);
              setEditing(true);
            }}
            className={SMALL_BUTTON}
          >
            Editar monto
          </button>
          <form action={voidAction}>
            <ConfirmSubmitButton
              message={`¿Anulás el aporte de ${item.amountLabel} de ${item.names}? No se puede deshacer.`}
              className={SMALL_BUTTON}
            >
              Anular
            </ConfirmSubmitButton>
          </form>
        </div>
      )}

      {active && showEditor && (
        <form
          action={editAction}
          className="flex w-full flex-wrap items-center gap-2"
        >
          <label className="flex items-center gap-2 text-sm">
            Monto $
            <input
              name="amount"
              inputMode="decimal"
              autoComplete="off"
              required
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              className="border-ink/40 w-32 border px-2 py-1"
            />
          </label>
          <button type="submit" disabled={saving} className={SMALL_BUTTON}>
            {saving ? "Guardando…" : "Guardar"}
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="text-sm underline underline-offset-4"
          >
            Cancelar
          </button>
        </form>
      )}

      {editState.status === "above_maximum" && showEditor && (
        <span role="alert" className="text-error w-full text-sm">
          Supera lo que falta para completar el regalo. Máximo:{" "}
          {formatCentsAsArs(editState.maxCents)}.
        </span>
      )}
      {editState.status !== "above_maximum" && showEditor && (
        <AdminChangeMessage state={editState} />
      )}
      <AdminChangeMessage state={confirmState} />
      <AdminChangeMessage state={voidState} />
    </li>
  );
}
