import { centsToPesosInput, formatCentsAsArs } from "@/lib/money";
import { EVENT_TIME_ZONE } from "@/lib/time-zone";
import type {
  AdminClaimRecord,
  AdminContributionRecord,
} from "@/modules/contribution/repositories/contribution-admin-repository";

export type AdminContributionStatus = "pending" | "confirmed" | "voided";

export type AdminContributionItem = {
  id: string;
  names: string;
  giftTitle: string;
  giftArchived: boolean;
  amountLabel: string;
  /** Pre-filled value for the "Editar monto" field. */
  amountInput: string;
  status: AdminContributionStatus;
  statusLabel: string;
  createdAtLabel: string;
};

export type AdminContributionSummary = {
  confirmedLabel: string;
  pendingLabel: string;
  pendingCount: number;
};

export type AdminClaimGroup = {
  giftId: string;
  giftTitle: string;
  giftArchived: boolean;
  claims: {
    id: string;
    names: string;
    createdAtLabel: string;
    voided: boolean;
  }[];
};

const dateFormat = new Intl.DateTimeFormat("es-AR", {
  timeZone: EVENT_TIME_ZONE,
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

const STATUS: Record<
  AdminContributionRecord["status"],
  { status: AdminContributionStatus; label: string; order: number }
> = {
  DECLARED: { status: "pending", label: "Pendiente", order: 0 },
  CONFIRMED: { status: "confirmed", label: "Confirmado", order: 1 },
  VOIDED: { status: "voided", label: "Anulado", order: 2 },
};

export function summarizeContributions(
  rows: AdminContributionRecord[],
): AdminContributionSummary {
  const sum = (status: AdminContributionRecord["status"]) =>
    rows
      .filter((row) => row.status === status)
      .reduce((total, row) => total + row.amountCents, 0);
  return {
    confirmedLabel: formatCentsAsArs(sum("CONFIRMED")),
    pendingLabel: formatCentsAsArs(sum("DECLARED")),
    pendingCount: rows.filter((row) => row.status === "DECLARED").length,
  };
}

/** Pending first, then confirmed, then voided; newest first inside each group (rows arrive newest first). */
export function toAdminContributionItems(
  rows: AdminContributionRecord[],
): AdminContributionItem[] {
  return [...rows]
    .sort((a, b) => STATUS[a.status].order - STATUS[b.status].order)
    .map((row) => ({
      id: row.id,
      names: row.guestNames.join(", "),
      giftTitle: row.giftTitle,
      giftArchived: row.giftArchived,
      amountLabel: formatCentsAsArs(row.amountCents),
      amountInput: centsToPesosInput(row.amountCents),
      status: STATUS[row.status].status,
      statusLabel: STATUS[row.status].label,
      createdAtLabel: dateFormat.format(row.createdAt),
    }));
}

export function groupClaimsByGift(rows: AdminClaimRecord[]): AdminClaimGroup[] {
  const groups = new Map<string, AdminClaimGroup>();
  for (const row of rows) {
    const group = groups.get(row.giftId) ?? {
      giftId: row.giftId,
      giftTitle: row.giftTitle,
      giftArchived: row.giftArchived,
      claims: [],
    };
    group.claims.push({
      id: row.id,
      names: row.guestNames.join(", "),
      createdAtLabel: dateFormat.format(row.createdAt),
      voided: row.voidedAt !== null,
    });
    groups.set(row.giftId, group);
  }
  return [...groups.values()];
}
