"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { logger } from "@/lib/logger";
import { ADMIN_ROUTES } from "@/lib/routes";
import { requireAdmin } from "@/modules/auth/services/require-admin";
import type { EventFormValues } from "@/modules/event/dto/event-admin-dto";
import { readEventForm } from "@/modules/event/schemas/event-form";
import {
  type FieldErrors,
  saveEventFromForm,
} from "@/modules/event/services/event-service";

// Submitted values travel back so the form shows them again: React resets
// forms after every action, which would otherwise wipe what was typed.
export type EventFormState =
  | { status: "idle" }
  | { status: "saved"; values: EventFormValues }
  | { status: "invalid"; values: EventFormValues; fieldErrors: FieldErrors }
  | { status: "error"; values: EventFormValues };

export async function saveEventAction(
  _previousState: EventFormState,
  formData: FormData,
): Promise<EventFormState> {
  // Server actions are public endpoints: authorization is checked here, not only in the layout.
  await requireAdmin();
  const values = readEventForm(formData);
  try {
    const result = await saveEventFromForm(getDb(), values);
    if (!result.ok)
      return { status: "invalid", values, fieldErrors: result.fieldErrors };
    revalidatePath(ADMIN_ROUTES.event);
    return { status: "saved", values };
  } catch (error) {
    logger.error("event save failed", {
      errorName: error instanceof Error ? error.name : "unknown",
    });
    return { status: "error", values };
  }
}
