import type { Metadata } from "next";
import { EventForm } from "@/components/admin/event-form";
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/modules/auth/services/require-admin";
import { getEventFormValues } from "@/modules/event/services/event-service";
import { PAGE, PAGE_TITLE } from "@/components/admin/admin-ui";

export const metadata: Metadata = { title: "Datos del evento" };

export default async function AdminEventPage() {
  await requireAdmin();
  const values = await getEventFormValues(getDb());
  return (
    <section className={PAGE}>
      <h1 className={PAGE_TITLE}>Datos del evento</h1>
      <EventForm initialValues={values} />
    </section>
  );
}
