import type { Metadata } from "next";
import Link from "next/link";
import { GiftList } from "@/components/admin/gift-list";
import { getDb } from "@/lib/db";
import { ADMIN_ROUTES } from "@/lib/routes";
import { requireAdmin } from "@/modules/auth/services/require-admin";
import { toAdminGiftView } from "@/modules/gift/dto/gift-admin-dto";
import { listGifts } from "@/modules/gift/services/gift-service";
import {
  BUTTON_PRIMARY,
  PAGE,
  PAGE_HEADER,
  PAGE_TITLE,
} from "@/components/admin/admin-ui";

export const metadata: Metadata = { title: "Regalos" };

export default async function AdminGiftsPage() {
  await requireAdmin();
  const gifts = (await listGifts(getDb())).map(toAdminGiftView);
  return (
    <section className={PAGE}>
      <div className={PAGE_HEADER}>
        <h1 className={PAGE_TITLE}>Regalos</h1>
        <Link href={ADMIN_ROUTES.newGift} className={BUTTON_PRIMARY}>
          Agregar regalo
        </Link>
      </div>
      <GiftList gifts={gifts} />
    </section>
  );
}
