import type { Metadata } from "next";
import Link from "next/link";
import { ADMIN_ROUTES } from "@/lib/routes";
import { requireAdmin } from "@/modules/auth/services/require-admin";

export const metadata: Metadata = { title: "Panel" };

export default async function AdminHomePage() {
  await requireAdmin();
  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-xl">Panel de los papás</h1>
      <ul className="flex flex-col gap-2">
        <li>
          <Link
            href={ADMIN_ROUTES.event}
            className="underline underline-offset-4"
          >
            Datos del evento
          </Link>
        </li>
      </ul>
    </section>
  );
}
