"use client";

import { type MouseEvent, startTransition } from "react";
import type { ShareLinks } from "@/modules/invitation/dto/invitation-admin-dto";
import { markInvitationSentAction } from "@/modules/invitation/services/invitation-actions";

const BUTTON = "border border-ink/40 px-3 py-1 text-sm";

/** Phones (touch screens) open their mail app; computers open Gmail on the web (phase 6, answer 3). */
const isPhone = () => window.matchMedia("(pointer: coarse)").matches;

export function ShareButtons({
  invitationId,
  share,
  names,
}: {
  invitationId: string;
  share: ShareLinks;
  names: string;
}) {
  // Plain links open WhatsApp or Gmail without popup blockers; the "sent" mark is recorded alongside.
  const markSent = (via: "WHATSAPP" | "EMAIL") =>
    startTransition(() => markInvitationSentAction(invitationId, via));

  function openMail(event: MouseEvent<HTMLAnchorElement>) {
    markSent("EMAIL");
    if (isPhone()) {
      event.preventDefault();
      window.location.href = share.mailtoUrl;
    }
  }

  return (
    <>
      <a
        href={share.whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => markSent("WHATSAPP")}
        aria-label={`Enviar por WhatsApp a ${names}`}
        className={BUTTON}
      >
        WhatsApp
      </a>
      <a
        href={share.gmailUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={openMail}
        aria-label={`Enviar por Gmail a ${names}`}
        className={BUTTON}
      >
        Gmail
      </a>
    </>
  );
}
