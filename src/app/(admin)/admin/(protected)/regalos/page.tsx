import type { Metadata } from "next";
import Link from "next/link";
import { GiftList } from "@/components/admin/gift-list";
import { getDb } from "@/lib/db";
import { ADMIN_ROUTES } from "@/lib/routes";
import { requireAdmin } from "@/modules/auth/services/require-admin";
import { toAdminGiftView } from "@/modules/gift/dto/gift-admin-dto";
import { listGifts } from "@/modules/gift/services/gift-service";

export const metadata: Metadata = { title: "Regalos" };

export default async function AdminGiftsPage() {
  await requireAdmin();
  const gifts = (await listGifts(getDb())).map(toAdminGiftView);
  return (
    <section className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl">Regalos</h1>
        <Link
          href={ADMIN_ROUTES.newGift}
          className="bg-ink text-paper px-4 py-2"
        >
          Agregar regalo
        </Link>
      </div>
      <GiftList gifts={gifts} />
    </section>
  );
}
