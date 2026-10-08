import { z } from "zod";
import {
  MAX_GUEST_NAMES,
  MAX_GUEST_NAME_LENGTH,
  MIN_GUEST_NAMES,
} from "@/modules/invitation/domain/invitation-rules";

export const GUEST_NAME_FIELD = "guestName";

export const guestNamesSchema = z
  .array(
    z
      .string()
      .trim()
      .max(
        MAX_GUEST_NAME_LENGTH,
        `Cada nombre puede tener hasta ${MAX_GUEST_NAME_LENGTH} caracteres.`,
      ),
  )
  // Empty inputs are ignored so the form can always show five boxes.
  .transform((names) => names.filter((name) => name !== ""))
  .pipe(
    z
      .array(z.string())
      .min(MIN_GUEST_NAMES, "Ingresá al menos un nombre.")
      .max(
        MAX_GUEST_NAMES,
        `Máximo ${MAX_GUEST_NAMES} nombres por invitación.`,
      ),
  );

/** Reads exactly MAX_GUEST_NAMES inputs; anything else in the form is ignored. */
export function readGuestNames(formData: FormData): string[] {
  return formData
    .getAll(GUEST_NAME_FIELD)
    .slice(0, MAX_GUEST_NAMES + 1)
    .map((value) => (typeof value === "string" ? value : ""));
}
