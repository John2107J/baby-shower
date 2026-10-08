import type { Metadata } from "next";
import Link from "next/link";
import { ADMIN_ROUTES } from "@/lib/routes";
import { requireAdmin } from "@/modules/auth/services/require-admin";
import { PAGE, PAGE_TITLE } from "@/components/admin/admin-ui";

export const metadata: Metadata = { title: "Panel" };

const SECTIONS = [
  { href: ADMIN_ROUTES.event, label: "Datos del evento" },
  { href: ADMIN_ROUTES.gifts, label: "Lista de regalos" },
  { href: ADMIN_ROUTES.invitations, label: "Invitaciones y links" },
  { href: ADMIN_ROUTES.confirmations, label: "Confirmaciones" },
  { href: ADMIN_ROUTES.contributions, label: "Aportes y regalos elegidos" },
  { href: ADMIN_ROUTES.account, label: "Cuenta y contraseña" },
] as const;

export default async function AdminHomePage() {
  await requireAdmin();
  return (
    <section className={PAGE}>
      <h1 className={PAGE_TITLE}>Inicio</h1>
      <ul className="border-rose-soft flex flex-col border-t">
        {SECTIONS.map((section) => (
          <li key={section.href} className="border-rose-soft border-b">
            <Link
              href={section.href}
              className="hover:text-rose flex min-h-14 items-center justify-between gap-4 text-lg"
            >
              {section.label}
              <span aria-hidden="true" className="text-rose">
                →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
