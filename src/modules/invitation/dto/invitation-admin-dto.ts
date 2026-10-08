import { invitationUrl } from "@/lib/public-url";
import type { AdminInvitationRecord } from "@/modules/invitation/repositories/invitation-repository";

const RSVP_LABELS = {
  PENDING: "Sin respuesta",
  ATTENDING: "Asiste",
  NOT_ATTENDING: "No asiste",
} as const;

export type AdminInvitationView = {
  id: string;
  guestNames: string[];
  link: string;
  rsvpLabel: string;
  canDelete: boolean;
};

export function toAdminInvitationView(
  invitation: AdminInvitationRecord,
  baseUrl: string,
): AdminInvitationView {
  const attendees =
    invitation.rsvpStatus === "ATTENDING" &&
    invitation.rsvpAttendeesCount !== null
      ? ` (${invitation.rsvpAttendeesCount})`
      : "";
  return {
    id: invitation.id,
    guestNames: invitation.guestNames,
    link: invitationUrl(baseUrl, invitation.token),
    rsvpLabel: RSVP_LABELS[invitation.rsvpStatus] + attendees,
    canDelete: !invitation.hasActivity,
  };
}
