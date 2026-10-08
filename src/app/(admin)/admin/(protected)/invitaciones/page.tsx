import type { Metadata } from "next";
import Link from "next/link";
import { InvitationList } from "@/components/admin/invitations/invitation-list";
import { getDb } from "@/lib/db";
import { getPublicBaseUrl } from "@/lib/public-url";
import { ADMIN_ROUTES } from "@/lib/routes";
import { requireAdmin } from "@/modules/auth/services/require-admin";
import { findEvent } from "@/modules/event/repositories/event-repository";
import { toAdminInvitationView } from "@/modules/invitation/dto/invitation-admin-dto";
import { getInvitations } from "@/modules/invitation/services/invitation-service";
import {
  BUTTON_PRIMARY,
  PAGE,
  PAGE_HEADER,
  PAGE_TITLE,
} from "@/components/admin/admin-ui";

export const metadata: Metadata = { title: "Invitaciones" };

export default async function AdminInvitationsPage() {
  await requireAdmin();
  const [invitations, baseUrl, event] = await Promise.all([
    getInvitations(getDb()),
    getPublicBaseUrl(),
    findEvent(getDb()),
  ]);
  return (
    <section className={PAGE}>
      <div className={PAGE_HEADER}>
        <h1 className={PAGE_TITLE}>Invitaciones</h1>
        <Link href={ADMIN_ROUTES.newInvitation} className={BUTTON_PRIMARY}>
          Nueva invitación
        </Link>
      </div>
      <p className="text-ink/70 text-sm">
        Cada link es personal: enviá a cada familia solo el suyo.
      </p>
      {!event && (
        <p className="text-sm">
          Para enviar por WhatsApp o Gmail, primero cargá los datos del evento:
          el mensaje lleva el nombre de la bebé.
        </p>
      )}
      <InvitationList
        invitations={invitations.map((invitation) =>
          toAdminInvitationView(invitation, baseUrl, event?.babyName ?? null),
        )}
      />
    </section>
  );
}
