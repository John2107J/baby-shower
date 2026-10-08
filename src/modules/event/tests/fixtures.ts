import type { EventFormField } from "@/modules/event/schemas/event-form";

/** Clearly fictitious test data (CLAUDE.md §9.12: never real event data in the repo). */
export const VALID_EVENT_FORM: Record<EventFormField, string> = {
  babyName: "Bebé de Prueba",
  eventDate: "2030-01-15",
  eventTime: "16:30",
  venueName: "Salón de Prueba",
  streetAddress: "Calle Falsa 123",
  city: "Ciudad de Prueba",
  mapsUrl: "https://maps.app.goo.gl/example",
  paymentAlias: "alias.de.prueba",
  paymentCbu: "2850590940090418135201",
  paymentHolderName: "Titular de Prueba",
};
