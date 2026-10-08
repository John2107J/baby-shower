import { z } from "zod";
import { MAX_ATTENDEES, MIN_ATTENDEES } from "@/modules/rsvp/domain/rsvp-rules";

export type RsvpAnswer =
  { attending: true; attendees: number } | { attending: false; attendees: 0 };

const attendeesSchema = z.coerce
  .number()
  .int()
  .min(MIN_ATTENDEES)
  .max(MAX_ATTENDEES);

/** Only these two fields are read; anything else in the request is ignored. */
export function parseRsvpForm(formData: FormData): RsvpAnswer | null {
  const answer = formData.get("answer");
  if (answer === "no") return { attending: false, attendees: 0 };
  if (answer !== "yes") return null;
  const attendees = attendeesSchema.safeParse(formData.get("attendees"));
  return attendees.success
    ? { attending: true, attendees: attendees.data }
    : null;
}
