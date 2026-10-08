import Link from "next/link";
import { ADMIN_ROUTES } from "@/lib/routes";
import { logoutAction } from "@/modules/auth/services/login-action";

const NAV_ITEMS = [
  { href: ADMIN_ROUTES.home, label: "Inicio" },
  { href: ADMIN_ROUTES.event, label: "Evento" },
  { href: ADMIN_ROUTES.gifts, label: "Regalos" },
  { href: ADMIN_ROUTES.invitations, label: "Invitaciones" },
  { href: ADMIN_ROUTES.confirmations, label: "Confirmaciones" },
] as const;

export function AdminNav() {
  return (
    <header className="border-rose-soft border-b">
      <nav className="mx-auto flex max-w-xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3 text-sm">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="underline-offset-4 hover:underline"
          >
            {item.label}
          </Link>
        ))}
        <form action={logoutAction} className="ml-auto">
          <button type="submit" className="underline-offset-4 hover:underline">
            Cerrar sesión
          </button>
        </form>
      </nav>
    </header>
  );
}
