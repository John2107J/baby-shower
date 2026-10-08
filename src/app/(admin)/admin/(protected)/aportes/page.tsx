import type { Metadata } from "next";
import { ClaimRow } from "@/components/admin/contributions/claim-row";
import { ContributionRow } from "@/components/admin/contributions/contribution-row";
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/modules/auth/services/require-admin";
import { getContributionsOverview } from "@/modules/contribution/services/contribution-admin-service";
import { PAGE, PAGE_TITLE } from "@/components/admin/admin-ui";

export const metadata: Metadata = { title: "Aportes" };

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-rose-soft flex flex-col gap-1 border-t pt-3">
      <span className="text-rose text-sm tracking-widest uppercase">
        {label}
      </span>
      <span className="text-2xl tabular-nums">{value}</span>
    </div>
  );
}

export default async function ContributionsPage() {
  await requireAdmin();
  const { summary, contributions, claimGroups } =
    await getContributionsOverview(getDb());
  return (
    <section className={PAGE}>
      <h1 className={PAGE_TITLE}>Aportes</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat label="Confirmado" value={summary.confirmedLabel} />
        <Stat label="Por confirmar" value={summary.pendingLabel} />
        <Stat
          label="Aportes por confirmar"
          value={String(summary.pendingCount)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-lg">Dinero</h2>
        {contributions.length === 0 ? (
          <p>Todavía no hay aportes.</p>
        ) : (
          <ul>
            {contributions.map((item) => (
              <ContributionRow key={item.id} item={item} />
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="text-lg">Yo lo llevo</h2>
        {claimGroups.length === 0 ? (
          <p>Todavía nadie eligió llevar un regalo.</p>
        ) : (
          claimGroups.map((group) => (
            <div key={group.giftId} className="flex flex-col gap-1">
              <h3 className="font-semibold">
                {group.giftTitle}
                {group.giftArchived && " (regalo archivado)"}
              </h3>
              <ul>
                {group.claims.map((claim) => (
                  <ClaimRow
                    key={claim.id}
                    claim={claim}
                    giftTitle={group.giftTitle}
                  />
                ))}
              </ul>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
