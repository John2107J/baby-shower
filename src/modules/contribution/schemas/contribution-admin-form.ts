import { z } from "zod";
import { parsePesosToCents } from "@/lib/money";

const MAX_AMOUNT_INPUT_LENGTH = 20;

const idSchema = z.uuid();
const amountSchema = z.string().trim().min(1).max(MAX_AMOUNT_INPUT_LENGTH);

export const isValidId = (id: string) => idSchema.safeParse(id).success;

/** Owner's answer 1 in phase 5b: the parents may set any amount above $0. */
export function parseAdminAmount(formData: FormData): number | null {
  const parsed = amountSchema.safeParse(formData.get("amount"));
  if (!parsed.success) return null;
  const cents = parsePesosToCents(parsed.data);
  return cents !== null && cents > 0 ? cents : null;
}
