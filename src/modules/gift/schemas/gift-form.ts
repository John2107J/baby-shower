import { z } from "zod";
import { parsePesosToCents } from "@/lib/money";
import {
  MAX_GIFT_PRICE_CENTS,
  MAX_GIFT_QUANTITY,
  MAX_GIFT_TITLE_LENGTH,
  MAX_PRODUCT_URL_LENGTH,
  MIN_GIFT_QUANTITY,
} from "@/modules/gift/domain/gift-rules";

export const GIFT_FORM_FIELDS = [
  "title",
  "productUrl",
  "referencePrice",
  "quantity",
] as const;
export type GiftFormField = (typeof GIFT_FORM_FIELDS)[number] | "image";
export type GiftFormValues = Record<(typeof GIFT_FORM_FIELDS)[number], string>;

export const giftFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Ingresá el nombre del regalo.")
    .max(MAX_GIFT_TITLE_LENGTH, `Máximo ${MAX_GIFT_TITLE_LENGTH} caracteres.`),
  productUrl: z
    .string()
    .trim()
    .pipe(
      z
        .url({
          protocol: /^https?$/,
          error: "Ingresá el link de la tienda (que empiece con https://).",
        })
        .max(MAX_PRODUCT_URL_LENGTH, "El link es demasiado largo."),
    ),
  referencePrice: z.string().transform((value, context) => {
    const cents = parsePesosToCents(value);
    if (cents === null || cents <= 0) {
      context.addIssue({
        code: "custom",
        message: "Ingresá un precio válido, por ejemplo 150000.",
      });
      return z.NEVER;
    }
    if (cents > MAX_GIFT_PRICE_CENTS) {
      context.addIssue({
        code: "custom",
        message: "El precio es demasiado alto.",
      });
      return z.NEVER;
    }
    return cents;
  }),
  quantity: z
    .string()
    .trim()
    .regex(/^\d+$/, "Ingresá un número entero.")
    .transform(Number)
    .pipe(
      z
        .number()
        .min(MIN_GIFT_QUANTITY, `Mínimo ${MIN_GIFT_QUANTITY}.`)
        .max(MAX_GIFT_QUANTITY, `Máximo ${MAX_GIFT_QUANTITY}.`),
    ),
});

export type GiftFormInput = z.infer<typeof giftFormSchema>;

export function readGiftForm(formData: FormData): {
  values: GiftFormValues;
  image: File | null;
} {
  const values = Object.fromEntries(
    GIFT_FORM_FIELDS.map((field) => {
      const value = formData.get(field);
      return [field, typeof value === "string" ? value : ""];
    }),
  ) as GiftFormValues;
  const image = formData.get("image");
  return {
    values,
    image: image instanceof File && image.size > 0 ? image : null,
  };
}
