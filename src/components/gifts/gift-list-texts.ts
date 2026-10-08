import type { GiftActionState } from "@/modules/contribution/services/gift-list-actions";

type FailureStatus = Exclude<GiftActionState["status"], "idle" | "saved">;

// Texts approved by the owner (phase 5).
export const GIFT_TEXTS = {
  claimed: "¡Gracias! Anotamos que llevás este regalo.",
  contributed: "¡Gracias! Los papás van a confirmar tu aporte.",
  complete: "Completo",
  awaitingConfirmation: "Aportes esperando confirmación",
  closed:
    "La lista de regalos ya cerró. Si necesitás avisar algo, escribile directamente a los papás.",
  noPaymentData:
    "Los papás todavía no cargaron los datos para transferir. Volvé a mirar en unos días.",
} as const;

export function failureText(
  status: FailureStatus,
  limits: { minLabel: string; maxLabel: string },
): string {
  switch (status) {
    case "not_available":
      return "Alguien se adelantó: este regalo ya no se puede elegir para llevar.";
    case "gift_not_found":
      return "Este regalo ya no está en la lista.";
    case "closed":
      return GIFT_TEXTS.closed;
    case "rate_limited":
      return "Hiciste muchos intentos seguidos. Esperá unos minutos y volvé a intentar.";
    case "too_soon":
      return "Ya anotamos un aporte tuyo recién. Para anotar otro, esperá 3 minutos.";
    case "below_minimum":
      return `El aporte mínimo es de ${limits.minLabel}.`;
    case "above_maximum":
      return `Podés aportar hasta ${limits.maxLabel}.`;
    case "nothing_left":
      return "Este regalo ya está cubierto.";
    case "invalid":
      return "Revisá el monto: escribilo solo con números, por ejemplo 15000.";
    case "not_found":
    case "error":
      return "No pudimos guardarlo. Intentá de nuevo en unos minutos.";
  }
}
