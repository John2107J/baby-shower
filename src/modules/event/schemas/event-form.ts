import { z } from "zod";
import {
  PAYMENT_ALIAS_PATTERN,
  isValidCbu,
  normalizeCbu,
} from "@/modules/event/domain/payment";

const MAX_BABY_NAME_LENGTH = 60;
const MAX_VENUE_LENGTH = 100;
const MAX_STREET_LENGTH = 120;
const MAX_CITY_LENGTH = 80;
const MAX_HOLDER_LENGTH = 80;
const MAX_URL_LENGTH = 500;

const requiredText = (max: number, message: string) =>
  z.string().trim().min(1, message).max(max, `Máximo ${max} caracteres.`);

/** Empty inputs become null so optional fields are stored as "not set". */
const optionalText = (schema: z.ZodType<string, string>) =>
  z
    .string()
    .trim()
    .transform((value) => (value === "" ? null : value))
    .pipe(schema.nullable());

export const EVENT_FORM_FIELDS = [
  "babyName",
  "eventDate",
  "eventTime",
  "venueName",
  "streetAddress",
  "city",
  "mapsUrl",
  "paymentAlias",
  "paymentCbu",
  "paymentHolderName",
] as const;

export type EventFormField = (typeof EVENT_FORM_FIELDS)[number];

export const eventFormSchema = z
  .object({
    babyName: requiredText(
      MAX_BABY_NAME_LENGTH,
      "Ingresá el nombre de la bebé.",
    ),
    eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ingresá la fecha."),
    eventTime: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Ingresá la hora."),
    venueName: optionalText(
      z
        .string()
        .max(MAX_VENUE_LENGTH, `Máximo ${MAX_VENUE_LENGTH} caracteres.`),
    ),
    streetAddress: requiredText(
      MAX_STREET_LENGTH,
      "Ingresá la calle y el número.",
    ),
    city: requiredText(MAX_CITY_LENGTH, "Ingresá la ciudad o localidad."),
    mapsUrl: optionalText(
      z
        .url({
          protocol: /^https?$/,
          error: "Ingresá un link válido (que empiece con https://).",
        })
        .max(MAX_URL_LENGTH, "El link es demasiado largo."),
    ),
    paymentAlias: optionalText(
      z
        .string()
        .regex(
          PAYMENT_ALIAS_PATTERN,
          "El alias debe tener de 6 a 20 letras, números, puntos o guiones.",
        ),
    ),
    paymentCbu: z
      .string()
      .transform(normalizeCbu)
      .transform((value) => (value === "" ? null : value))
      .pipe(
        z
          .string()
          .refine(isValidCbu, "El CBU/CVU no es válido. Revisá los 22 números.")
          .nullable(),
      ),
    paymentHolderName: requiredText(
      MAX_HOLDER_LENGTH,
      "Ingresá el nombre del titular de la cuenta.",
    ),
  })
  .refine((data) => data.paymentAlias !== null || data.paymentCbu !== null, {
    path: ["paymentAlias"],
    message: "Ingresá al menos el alias o el CBU/CVU.",
  });

export type EventFormInput = z.infer<typeof eventFormSchema>;

/** Reads only the known fields; anything else in the form data is ignored. */
export function readEventForm(
  formData: FormData,
): Record<EventFormField, string> {
  return Object.fromEntries(
    EVENT_FORM_FIELDS.map((field) => {
      const value = formData.get(field);
      return [field, typeof value === "string" ? value : ""];
    }),
  ) as Record<EventFormField, string>;
}
