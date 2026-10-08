import type { PrismaClient } from "@/generated/prisma/client";

/**
 * There is exactly one event. A fixed primary key makes "create or update"
 * atomic: two concurrent first saves can never create two rows.
 */
export const EVENT_ID = "00000000-0000-4000-8000-000000000001";

export type EventRecord = {
  babyName: string;
  startsAt: Date;
  venueName: string | null;
  streetAddress: string;
  city: string;
  mapsUrl: string | null;
  paymentAlias: string | null;
  paymentCbu: string | null;
  paymentHolderName: string;
};

const EVENT_SELECT = {
  babyName: true,
  startsAt: true,
  venueName: true,
  streetAddress: true,
  city: true,
  mapsUrl: true,
  paymentAlias: true,
  paymentCbu: true,
  paymentHolderName: true,
} as const;

export function findEvent(db: PrismaClient): Promise<EventRecord | null> {
  return db.event.findUnique({ where: { id: EVENT_ID }, select: EVENT_SELECT });
}

export async function saveEvent(
  db: PrismaClient,
  data: EventRecord,
): Promise<void> {
  await db.event.upsert({
    where: { id: EVENT_ID },
    create: { id: EVENT_ID, ...data },
    update: data,
  });
}
