import type { PrismaClient } from "@/generated/prisma/client";
import { EVENT_TIME_ZONE, zonedDateTimeToUtc } from "@/lib/time-zone";
import {
  type EventFormValues,
  toEventFormValues,
} from "@/modules/event/dto/event-admin-dto";
import {
  findEvent,
  saveEvent,
} from "@/modules/event/repositories/event-repository";
import {
  type EventFormField,
  eventFormSchema,
} from "@/modules/event/schemas/event-form";

export type FieldErrors = Partial<Record<EventFormField, string>>;

export type SaveEventResult =
  { ok: true } | { ok: false; fieldErrors: FieldErrors };

export async function getEventFormValues(
  db: PrismaClient,
): Promise<EventFormValues> {
  return toEventFormValues(await findEvent(db));
}

export async function saveEventFromForm(
  db: PrismaClient,
  rawValues: Record<EventFormField, string>,
): Promise<SaveEventResult> {
  const parsed = eventFormSchema.safeParse(rawValues);
  if (!parsed.success) {
    const fieldErrors: FieldErrors = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as EventFormField | undefined;
      if (field && !fieldErrors[field]) fieldErrors[field] = issue.message;
    }
    return { ok: false, fieldErrors };
  }

  const { eventDate, eventTime, ...rest } = parsed.data;
  await saveEvent(db, {
    ...rest,
    startsAt: zonedDateTimeToUtc(eventDate, eventTime, EVENT_TIME_ZONE),
  });
  return { ok: true };
}
