import { formatCentsAsArs } from "@/lib/money";
import {
  MIN_CONTRIBUTION_CENTS,
  computeGiftProgress,
} from "@/modules/contribution/domain/gift-progress";
import type {
  OwnCommitmentRecord,
  PublicGiftRecord,
} from "@/modules/contribution/repositories/gift-list-repository";
import type { EventRecord } from "@/modules/event/repositories/event-repository";

const PERCENT = 100;

export type PublicGiftProgress =
  | { state: "complete" }
  | {
      state: "open" | "awaiting_confirmation";
      /** "Unidad 1 de 2" (decision 39); null when the gift has a single unit. */
      unitLabel: string | null;
      percent: number;
      missingLabel: string;
      canClaim: boolean;
      minContributionCents: number;
      maxContributionCents: number;
      maxContributionLabel: string;
    };

/**
 * One gift as guests see it: aggregated progress only. Built field by field
 * on purpose: names and individual amounts never reach the browser
 * (CLAUDE.md §3.5). A test checks the exact set of keys.
 */
export type PublicGiftView = {
  id: string;
  title: string;
  imageUrl: string;
  productUrl: string;
  unitPriceLabel: string;
  quantity: number;
  progress: PublicGiftProgress;
};

export type OwnCommitmentView =
  | { kind: "claim"; giftTitle: string }
  | {
      kind: "contribution";
      giftTitle: string;
      amountLabel: string;
      confirmed: boolean;
    };

export type PaymentView = {
  alias: string | null;
  cbu: string | null;
  holderName: string;
};

export type GuestGiftListView = {
  babyName: string;
  open: boolean;
  payment: PaymentView;
  gifts: PublicGiftView[];
  ownCommitments: OwnCommitmentView[];
};

function toProgressView(gift: PublicGiftRecord): PublicGiftProgress {
  const progress = computeGiftProgress(gift.commitments);
  if (progress.state === "complete") return { state: "complete" };
  return {
    state: progress.state,
    unitLabel:
      gift.quantity > 1
        ? `Unidad ${progress.currentUnit} de ${gift.quantity}`
        : null,
    percent: Math.floor(
      (progress.currentUnitPaidCents * PERCENT) / gift.unitPriceCents,
    ),
    missingLabel: formatCentsAsArs(progress.currentUnitMissingCents),
    canClaim: progress.canClaim,
    minContributionCents: Math.min(
      MIN_CONTRIBUTION_CENTS,
      progress.maxContributionCents,
    ),
    maxContributionCents: progress.maxContributionCents,
    maxContributionLabel: formatCentsAsArs(progress.maxContributionCents),
  };
}

export function toPublicGiftView(gift: PublicGiftRecord): PublicGiftView {
  return {
    id: gift.id,
    title: gift.title,
    imageUrl: gift.imageUrl,
    productUrl: gift.productUrl,
    unitPriceLabel: formatCentsAsArs(gift.unitPriceCents),
    quantity: gift.quantity,
    progress: toProgressView(gift),
  };
}

/** Decision 43: complete gifts go to the end; otherwise the parents' order is kept. */
export function sortForGuests(gifts: PublicGiftView[]): PublicGiftView[] {
  const isComplete = (gift: PublicGiftView) =>
    gift.progress.state === "complete" ? 1 : 0;
  return [...gifts].sort((a, b) => isComplete(a) - isComplete(b));
}

export function toOwnCommitmentView(
  record: OwnCommitmentRecord,
): OwnCommitmentView {
  if (record.kind === "claim")
    return { kind: "claim", giftTitle: record.giftTitle };
  return {
    kind: "contribution",
    giftTitle: record.giftTitle,
    amountLabel: formatCentsAsArs(record.amountCents),
    confirmed: record.status === "CONFIRMED",
  };
}

export function toGuestGiftListView(
  event: EventRecord,
  open: boolean,
  gifts: PublicGiftRecord[],
  ownCommitments: OwnCommitmentRecord[],
): GuestGiftListView {
  return {
    babyName: event.babyName,
    open,
    payment: {
      alias: event.paymentAlias,
      cbu: event.paymentCbu,
      holderName: event.paymentHolderName,
    },
    gifts: sortForGuests(gifts.map(toPublicGiftView)),
    ownCommitments: ownCommitments.map(toOwnCommitmentView),
  };
}
