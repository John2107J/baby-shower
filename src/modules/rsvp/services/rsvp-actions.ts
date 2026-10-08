"use server";

import { headers } from "next/headers";
import { getClientIp } from "@/lib/client-ip";
import { getDb } from "@/lib/db";
import { logger } from "@/lib/logger";
import { parseRsvpForm } from "@/modules/rsvp/schemas/rsvp-form";
import { submitRsvp } from "@/modules/rsvp/services/rsvp-service";

export type RsvpFormState =
  | { status: "idle" }
  | { status: "saved"; attending: boolean; attendees: number; savedAt: number }
  | { status: "invalid" | "not_found" | "closed" | "rate_limited" | "error" };

/** Public action: the invitation token is the only credential (CLAUDE.md §3.2). */
export async function submitRsvpAction(
  token: string,
  _previousState: RsvpFormState,
  formData: FormData,
): Promise<RsvpFormState> {
  try {
    const clientIp = getClientIp(await headers());
    const result = await submitRsvp(
      getDb(),
      token,
      parseRsvpForm(formData),
      clientIp,
    );
    if (!result.ok) return { status: result.reason };
    return {
      status: "saved",
      attending: result.answer.attending,
      attendees: result.answer.attendees,
      savedAt: Date.now(),
    };
  } catch (error) {
    logger.error("rsvp save failed", {
      errorName: error instanceof Error ? error.name : "unknown",
    });
    return { status: "error" };
  }
}
