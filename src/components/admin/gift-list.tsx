import Link from "next/link";
import { GiftPhotoLink } from "@/components/admin/gift-photo-link";
import { ADMIN_ROUTES } from "@/lib/routes";
import type { AdminGiftView } from "@/modules/gift/dto/gift-admin-dto";
import {
  moveGiftAction,
  setGiftArchivedAction,
} from "@/modules/gift/services/gift-actions";

const SMALL_BUTTON =
  "border border-ink/40 px-3 py-1 text-sm disabled:opacity-30";

function GiftRow({
  gift,
  isFirst,
  isLast,
}: {
  gift: AdminGiftView;
  isFirst: boolean;
  isLast: boolean;
}) {
  return (
    <li className="border-rose-soft flex gap-4 border-b py-4">
      <GiftPhotoLink
        title={gift.title}
        imageUrl={gift.imageUrl}
        productUrl={gift.productUrl}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="font-medium break-words">{gift.title}</p>
        <p className="text-sm">
          {gift.priceLabel} · cantidad: {gift.quantity}
        </p>
        <p className="text-ink/70 text-sm">
          Reservadas: {gift.claimedUnits}
          {gift.hasContributions && " · tiene aportes"}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {!gift.isArchived && (
            <>
              <form action={moveGiftAction.bind(null, gift.id, "up")}>
                <button
                  type="submit"
                  className={SMALL_BUTTON}
                  disabled={isFirst}
                  aria-label={`Subir ${gift.title}`}
                >
                  ↑
                </button>
              </form>
              <form action={moveGiftAction.bind(null, gift.id, "down")}>
                <button
                  type="submit"
                  className={SMALL_BUTTON}
                  disabled={isLast}
                  aria-label={`Bajar ${gift.title}`}
                >
                  ↓
                </button>
              </form>
            </>
          )}
          <Link href={ADMIN_ROUTES.editGift(gift.id)} className={SMALL_BUTTON}>
            Editar
          </Link>
          <form
            action={setGiftArchivedAction.bind(null, gift.id, !gift.isArchived)}
          >
            <button type="submit" className={SMALL_BUTTON}>
              {gift.isArchived ? "Restaurar" : "Archivar"}
            </button>
          </form>
        </div>
      </div>
    </li>
  );
}

export function GiftList({ gifts }: { gifts: AdminGiftView[] }) {
  const active = gifts.filter((gift) => !gift.isArchived);
  const archived = gifts.filter((gift) => gift.isArchived);
  return (
    <div className="flex flex-col gap-8">
      {active.length === 0 ? (
        <p>Todavía no hay regalos cargados.</p>
      ) : (
        <ul>
          {active.map((gift, index) => (
            <GiftRow
              key={gift.id}
              gift={gift}
              isFirst={index === 0}
              isLast={index === active.length - 1}
            />
          ))}
        </ul>
      )}
      {archived.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-rose text-sm tracking-widest uppercase">
            Archivados
          </h2>
          <p className="text-ink/70 text-sm">
            Los invitados no los ven. Conservan sus reservas y aportes.
          </p>
          <ul>
            {archived.map((gift) => (
              <GiftRow key={gift.id} gift={gift} isFirst isLast />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
