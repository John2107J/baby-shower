import type { PrismaClient } from "@/generated/prisma/client";
import {
  type RsvpSummary,
  sortForFollowUp,
  summarizeRsvps,
} from "@/modules/rsvp/domain/rsvp-summary";
import {
  type RsvpListItem,
  toRsvpListItem,
} from "@/modules/rsvp/dto/rsvp-admin-dto";
import { listRsvpRows } from "@/modules/rsvp/repositories/rsvp-summary-repository";

export async function getRsvpOverview(
  db: PrismaClient,
): Promise<{ summary: RsvpSummary; items: RsvpListItem[] }> {
  const rows = await listRsvpRows(db);
  return {
    summary: summarizeRsvps(rows),
    items: sortForFollowUp(rows).map(toRsvpListItem),
  };
}
