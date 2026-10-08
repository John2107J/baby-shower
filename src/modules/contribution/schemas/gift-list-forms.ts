import { z } from "zod";
import { parsePesosToCents } from "@/lib/money";

const MAX_AMOUNT_INPUT_LENGTH = 20;

const claimSchema = z.object({
  giftId: z.uuid(),
  idempotencyKey: z.uuid(),
});

const contributionSchema = claimSchema.extend({
  amount: z.string().trim().min(1).max(MAX_AMOUNT_INPUT_LENGTH),
});

export type ClaimInput = z.infer<typeof claimSchema>;
export type ContributionInput = ClaimInput & { amountCents: number };

/** Only these fields are read; anything else in the request is ignored. */
export function parseClaimForm(formData: FormData): ClaimInput | null {
  const parsed = claimSchema.safeParse({
    giftId: formData.get("giftId"),
    idempotencyKey: formData.get("idempotencyKey"),
  });
  return parsed.success ? parsed.data : null;
}

/** Limits on the amount (minimum, what is left) are checked later, under the gift's lock. */
export function parseContributionForm(
  formData: FormData,
): ContributionInput | null {
  const parsed = contributionSchema.safeParse({
    giftId: formData.get("giftId"),
    idempotencyKey: formData.get("idempotencyKey"),
    amount: formData.get("amount"),
  });
  if (!parsed.success) return null;
  const amountCents = parsePesosToCents(parsed.data.amount);
  if (amountCents === null) return null;
  return {
    giftId: parsed.data.giftId,
    idempotencyKey: parsed.data.idempotencyKey,
    amountCents,
  };
}
