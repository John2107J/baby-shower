import type { AdminChangeState } from "@/modules/contribution/services/contribution-admin-actions";

/** Feedback for the parents after confirming, editing or voiding. */
export function AdminChangeMessage({ state }: { state: AdminChangeState }) {
  let text: string | null = null;
  switch (state.status) {
    case "above_maximum":
      text = "Supera lo que falta para completar el regalo.";
      break;
    case "invalid":
      text = "Escribí un monto mayor a $0, por ejemplo 15000.";
      break;
    case "voided":
      text = "Este aporte ya estaba anulado.";
      break;
    case "not_found":
      text = "No lo encontramos. Recargá la página.";
      break;
    case "error":
      text = "No pudimos guardarlo. Intentá de nuevo.";
      break;
  }
  if (!text) return null;
  return (
    <span role="alert" className="text-error w-full text-sm">
      {text}
    </span>
  );
}
