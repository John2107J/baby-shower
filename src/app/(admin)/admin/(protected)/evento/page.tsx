import type { Metadata } from "next";
import { EventForm } from "@/components/admin/event-form";
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/modules/auth/services/require-admin";
import { getEventFormValues } from "@/modules/event/services/event-service";

export const metadata: Metadata = { title: "Datos del evento" };

export default async function AdminEventPage() {
  await requireAdmin();
  const values = await getEventFormValues(getDb());
  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-xl">Datos del evento</h1>
      <EventForm initialValues={values} />
    </section>
  );
}
