import type { Metadata } from "next";
import { GiftForm } from "@/components/admin/gift-form";
import { requireAdmin } from "@/modules/auth/services/require-admin";
import { EMPTY_GIFT_FORM_VALUES } from "@/modules/gift/dto/gift-admin-dto";
import { createGiftAction } from "@/modules/gift/services/gift-actions";
import { PAGE, PAGE_TITLE } from "@/components/admin/admin-ui";

export const metadata: Metadata = { title: "Agregar regalo" };

export default async function NewGiftPage() {
  await requireAdmin();
  return (
    <section className={PAGE}>
      <h1 className={PAGE_TITLE}>Agregar regalo</h1>
      <GiftForm
        action={createGiftAction}
        initialValues={EMPTY_GIFT_FORM_VALUES}
        submitLabel="Agregar"
      />
    </section>
  );
}
