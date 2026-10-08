import { invitationUrl } from "@/lib/public-url";
import {
  buildShareMessage,
  gmailComposeUrl,
  mailtoUrl,
  whatsappShareUrl,
} from "@/modules/invitation/domain/share-message";
import type { AdminInvitationRecord } from "@/modules/invitation/repositories/invitation-repository";

const RSVP_LABELS = {
  PENDING: "Sin respuesta",
  ATTENDING: "Asiste",
  NOT_ATTENDING: "No asiste",
} as const;

const SENT_LABELS = {
  WHATSAPP: "Enviada por WhatsApp",
  EMAIL: "Enviada por mail",
} as const;

export type ShareLinks = {
  whatsappUrl: string;
  gmailUrl: string;
  mailtoUrl: string;
};

export type AdminInvitationView = {
  id: string;
  guestNames: string[];
  link: string;
  rsvpLabel: string;
  /** Null until the parents use one of the share buttons (phase 6, answer 4). */
  sentLabel: string | null;
  /** Null while the event has no data yet: the message needs the baby's name. */
  share: ShareLinks | null;
  canDelete: boolean;
};

export function toAdminInvitationView(
  invitation: AdminInvitationRecord,
  baseUrl: string,
  babyName: string | null,
): AdminInvitationView {
  const link = invitationUrl(baseUrl, invitation.token);
  const message = babyName
    ? buildShareMessage({ guestNames: invitation.guestNames, babyName, link })
    : null;
  const attendees =
    invitation.rsvpStatus === "ATTENDING" &&
    invitation.rsvpAttendeesCount !== null
      ? ` (${invitation.rsvpAttendeesCount})`
      : "";
  return {
    id: invitation.id,
    guestNames: invitation.guestNames,
    link,
    rsvpLabel: RSVP_LABELS[invitation.rsvpStatus] + attendees,
    sentLabel: invitation.sentVia ? SENT_LABELS[invitation.sentVia] : null,
    share: message
      ? {
          whatsappUrl: whatsappShareUrl(message),
          gmailUrl: gmailComposeUrl(message),
          mailtoUrl: mailtoUrl(message),
        }
      : null,
    canDelete: !invitation.hasActivity,
  };
}
