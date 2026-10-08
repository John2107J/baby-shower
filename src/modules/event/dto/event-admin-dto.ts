import { EVENT_TIME_ZONE, utcToZonedDateTime } from "@/lib/time-zone";
import type { EventRecord } from "@/modules/event/repositories/event-repository";
import type { EventFormField } from "@/modules/event/schemas/event-form";

/** Values to prefill the admin form, as the inputs expect them. */
export type EventFormValues = Record<EventFormField, string>;

export const EMPTY_EVENT_FORM_VALUES: EventFormValues = {
  babyName: "",
  eventDate: "",
  eventTime: "",
  venueName: "",
  streetAddress: "",
  city: "",
  mapsUrl: "",
  paymentAlias: "",
  paymentCbu: "",
  paymentHolderName: "",
};

export function toEventFormValues(event: EventRecord | null): EventFormValues {
  if (!event) return EMPTY_EVENT_FORM_VALUES;
  const { date, time } = utcToZonedDateTime(event.startsAt, EVENT_TIME_ZONE);
  return {
    babyName: event.babyName,
    eventDate: date,
    eventTime: time,
    venueName: event.venueName ?? "",
    streetAddress: event.streetAddress,
    city: event.city,
    mapsUrl: event.mapsUrl ?? "",
    paymentAlias: event.paymentAlias ?? "",
    paymentCbu: event.paymentCbu ?? "",
    paymentHolderName: event.paymentHolderName,
  };
}
