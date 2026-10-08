import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GiftForm } from "@/components/admin/gift-form";
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/modules/auth/services/require-admin";
import { toGiftFormValues } from "@/modules/gift/dto/gift-admin-dto";
import { updateGiftAction } from "@/modules/gift/services/gift-actions";
import { getGift } from "@/modules/gift/services/gift-service";

export const metadata: Metadata = { title: "Editar regalo" };

export default async function EditGiftPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const gift = await getGift(getDb(), id);
  if (!gift) notFound();
  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-xl">Editar regalo</h1>
      <GiftForm
        action={updateGiftAction.bind(null, gift.id)}
        initialValues={toGiftFormValues(gift)}
        currentPhoto={{
          title: gift.title,
          imageUrl: gift.imageUrl,
          productUrl: gift.productUrl,
        }}
        hasContributions={gift.activeContributionsCount > 0}
        submitLabel="Guardar cambios"
      />
    </section>
  );
}
