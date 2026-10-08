"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ADMIN_ROUTES } from "@/lib/routes";
import { logoutAction } from "@/modules/auth/services/login-action";

const NAV_ITEMS = [
  { href: ADMIN_ROUTES.home, label: "Inicio" },
  { href: ADMIN_ROUTES.event, label: "Evento" },
  { href: ADMIN_ROUTES.gifts, label: "Regalos" },
  { href: ADMIN_ROUTES.invitations, label: "Invitaciones" },
  { href: ADMIN_ROUTES.confirmations, label: "Confirmaciones" },
  { href: ADMIN_ROUTES.contributions, label: "Aportes" },
  { href: ADMIN_ROUTES.account, label: "Cuenta" },
] as const;

const MENU_ID = "admin-menu";

function isCurrent(pathname: string, href: string) {
  return href === ADMIN_ROUTES.home
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);
}

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="size-6" aria-hidden="true">
      {open ? (
        <path
          d="M6 6l12 12M18 6L6 18"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      ) : (
        <path
          d="M4 7h16M4 12h16M4 17h16"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

/**
 * Phones and tablets: a ☰ button at the top right opens the menu downwards,
 * one option per row. Computers (lg and up): the links stay visible in one row.
 */
export function AdminNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close after navigating (state adjusted during render, as React recommends).
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const linkClass = (href: string) =>
    isCurrent(pathname, href)
      ? "text-rose font-semibold"
      : "text-ink hover:text-rose";

  return (
    <header className="border-rose-soft bg-paper sticky top-0 z-20 border-b">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-6 px-5">
        <Link
          href={ADMIN_ROUTES.home}
          className="text-lg font-semibold tracking-tight whitespace-nowrap"
        >
          Panel de los papás
        </Link>

        <nav aria-label="Secciones del panel" className="hidden lg:block">
          <ul className="flex items-center gap-5 text-sm whitespace-nowrap">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={
                    isCurrent(pathname, item.href) ? "page" : undefined
                  }
                  className={linkClass(item.href)}
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <form action={logoutAction}>
                <button type="submit" className="text-ink-soft hover:text-ink">
                  Cerrar sesión
                </button>
              </form>
            </li>
          </ul>
        </nav>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls={MENU_ID}
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          className="-mr-2 inline-flex size-11 items-center justify-center lg:hidden"
        >
          <MenuIcon open={open} />
        </button>
      </div>

      {open && (
        <>
          {/* Tapping outside the menu closes it. */}
          <div
            aria-hidden="true"
            onClick={() => setOpen(false)}
            className="bg-ink/20 fixed inset-x-0 top-16 bottom-0 lg:hidden"
          />
          <nav
            id={MENU_ID}
            aria-label="Secciones del panel"
            className="border-rose-soft bg-paper absolute inset-x-0 top-16 border-b lg:hidden"
          >
            <ul className="mx-auto flex max-w-3xl flex-col px-5 py-2">
              {NAV_ITEMS.map((item) => (
                <li key={item.href} className="border-rose-soft border-b">
                  <Link
                    href={item.href}
                    aria-current={
                      isCurrent(pathname, item.href) ? "page" : undefined
                    }
                    onClick={() => setOpen(false)}
                    className={`flex min-h-13 items-center text-lg ${linkClass(item.href)}`}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <form action={logoutAction}>
                  <button
                    type="submit"
                    className="text-ink-soft flex min-h-13 w-full items-center text-lg"
                  >
                    Cerrar sesión
                  </button>
                </form>
              </li>
            </ul>
          </nav>
        </>
      )}
    </header>
  );
}
