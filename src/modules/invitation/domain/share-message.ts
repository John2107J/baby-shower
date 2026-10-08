import { formatGuestNames } from "@/modules/invitation/domain/invitation-rules";

export type ShareMessage = { subject: string; body: string };

/** Texts approved by the owner (phase 6): valid for one person or a family. */
export function buildShareMessage({
  guestNames,
  babyName,
  link,
}: {
  guestNames: string[];
  babyName: string;
  link: string;
}): ShareMessage {
  return {
    subject: `Invitación al Baby Shower de ${babyName}`,
    body: [
      `¡Hola, ${formatGuestNames(guestNames)}!`,
      `Esta es la invitación al Baby Shower de ${babyName}. En este link podés confirmar asistencia y ver la lista de regalos:`,
      link,
    ].join("\n"),
  };
}

/** No phone number: WhatsApp asks which contact to send it to (phase 6, answer 2). */
export function whatsappShareUrl(message: ShareMessage): string {
  return `https://wa.me/?text=${encodeURIComponent(message.body)}`;
}

/** Gmail on the web, used on computers (phase 6, answer 3). */
export function gmailComposeUrl(message: ShareMessage): string {
  const params = new URLSearchParams({
    view: "cm",
    fs: "1",
    su: message.subject,
    body: message.body,
  });
  return `https://mail.google.com/mail/?${params.toString()}`;
}

/** The phone's mail app (Gmail on most Android phones), used on phones. */
export function mailtoUrl(message: ShareMessage): string {
  return `mailto:?subject=${encodeURIComponent(message.subject)}&body=${encodeURIComponent(message.body)}`;
}
