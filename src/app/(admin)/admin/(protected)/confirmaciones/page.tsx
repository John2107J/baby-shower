import type { Metadata } from "next";
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/modules/auth/services/require-admin";
import { getRsvpOverview } from "@/modules/rsvp/services/rsvp-summary-service";
import { PAGE, PAGE_TITLE } from "@/components/admin/admin-ui";

export const metadata: Metadata = { title: "Confirmaciones" };

const STATUS_STYLE = {
  pending: "border-ink/40 text-ink",
  attending: "border-rose bg-rose text-paper",
  not_attending: "border-ink/20 text-ink/60",
} as const;

function Stat({
  label,
  value,
  detail,
}: {
  label: string;
  value: number;
  detail: string;
}) {
  return (
    <div className="border-rose-soft flex flex-col gap-1 border-t pt-3">
      <span className="text-rose text-sm tracking-widest uppercase">
        {label}
      </span>
      <span className="text-3xl tabular-nums">{value}</span>
      <span className="text-ink/70 text-sm">{detail}</span>
    </div>
  );
}

const plural = (n: number, one: string, many: string) =>
  `${n} ${n === 1 ? one : many}`;

export default async function ConfirmationsPage() {
  await requireAdmin();
  const { summary, items } = await getRsvpOverview(getDb());
  return (
    <section className={PAGE}>
      <h1 className={PAGE_TITLE}>Confirmaciones</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat
          label="Vienen"
          value={summary.attending.people}
          detail={`${summary.attending.people === 1 ? "persona" : "personas"} · ${plural(summary.attending.invitations, "invitación", "invitaciones")}`}
        />
        <Stat
          label="No vienen"
          value={summary.notAttending.invitations}
          detail={`${summary.notAttending.invitations === 1 ? "invitación" : "invitaciones"} · ${plural(summary.notAttending.names, "nombre", "nombres")}`}
        />
        <Stat
          label="Faltan responder"
          value={summary.pending.invitations}
          detail={`${summary.pending.invitations === 1 ? "invitación" : "invitaciones"} · ${plural(summary.pending.names, "nombre", "nombres")}`}
        />
      </div>

      {items.length === 0 ? (
        <p>Todavía no hay invitaciones.</p>
      ) : (
        <ul>
          {items.map((item) => (
            <li
              key={item.id}
              className="border-rose-soft flex flex-wrap items-center gap-x-3 gap-y-1.5 border-b py-4"
            >
              <span className="min-w-0 flex-1 break-words">{item.names}</span>
              <span
                className={`border px-2 py-0.5 text-sm whitespace-nowrap ${STATUS_STYLE[item.status]}`}
              >
                {item.statusLabel}
              </span>
              {item.answeredAt && (
                <span className="text-ink/60 w-full text-sm">
                  Respondió el {item.answeredAt}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
