import type { Metadata } from "next";
import Link from "next/link";
import { InvitationList } from "@/components/admin/invitations/invitation-list";
import { getDb } from "@/lib/db";
import { getPublicBaseUrl } from "@/lib/public-url";
import { ADMIN_ROUTES } from "@/lib/routes";
import { requireAdmin } from "@/modules/auth/services/require-admin";
import { toAdminInvitationView } from "@/modules/invitation/dto/invitation-admin-dto";
import { getInvitations } from "@/modules/invitation/services/invitation-service";

export const metadata: Metadata = { title: "Invitaciones" };

export default async function AdminInvitationsPage() {
  await requireAdmin();
  const [invitations, baseUrl] = await Promise.all([
    getInvitations(getDb()),
    getPublicBaseUrl(),
  ]);
  return (
    <section className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl">Invitaciones</h1>
        <Link
          href={ADMIN_ROUTES.newInvitation}
          className="bg-ink text-paper px-4 py-2"
        >
          Nueva invitación
        </Link>
      </div>
      <p className="text-ink/70 text-sm">
        Cada link es personal: enviá a cada familia solo el suyo.
      </p>
      <InvitationList
        invitations={invitations.map((invitation) =>
          toAdminInvitationView(invitation, baseUrl),
        )}
      />
    </section>
  );
}
