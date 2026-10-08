import type { Metadata } from "next";
import { GiftForm } from "@/components/admin/gift-form";
import { requireAdmin } from "@/modules/auth/services/require-admin";
import { EMPTY_GIFT_FORM_VALUES } from "@/modules/gift/dto/gift-admin-dto";
import { createGiftAction } from "@/modules/gift/services/gift-actions";

export const metadata: Metadata = { title: "Agregar regalo" };

export default async function NewGiftPage() {
  await requireAdmin();
  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-xl">Agregar regalo</h1>
      <GiftForm
        action={createGiftAction}
        initialValues={EMPTY_GIFT_FORM_VALUES}
        submitLabel="Agregar"
      />
    </section>
  );
}
