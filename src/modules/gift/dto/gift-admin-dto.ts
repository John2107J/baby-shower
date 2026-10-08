import { centsToPesosInput, formatCentsAsArs } from "@/lib/money";
import type { AdminGiftRecord } from "@/modules/gift/repositories/gift-repository";
import type { GiftFormValues } from "@/modules/gift/schemas/gift-form";

export type AdminGiftView = {
  id: string;
  title: string;
  imageUrl: string;
  productUrl: string;
  priceLabel: string;
  quantity: number;
  claimedUnits: number;
  hasContributions: boolean;
  isArchived: boolean;
};

export function toAdminGiftView(gift: AdminGiftRecord): AdminGiftView {
  return {
    id: gift.id,
    title: gift.title,
    imageUrl: gift.imageUrl,
    productUrl: gift.productUrl,
    priceLabel: formatCentsAsArs(gift.referencePriceCents),
    quantity: gift.quantity,
    claimedUnits: gift.claimedUnits,
    hasContributions: gift.activeContributionsCount > 0,
    isArchived: gift.archivedAt !== null,
  };
}

export const EMPTY_GIFT_FORM_VALUES: GiftFormValues = {
  title: "",
  productUrl: "",
  referencePrice: "",
  quantity: "1",
};

export function toGiftFormValues(gift: AdminGiftRecord): GiftFormValues {
  return {
    title: gift.title,
    productUrl: gift.productUrl,
    referencePrice: centsToPesosInput(gift.referencePriceCents),
    quantity: String(gift.quantity),
  };
}
