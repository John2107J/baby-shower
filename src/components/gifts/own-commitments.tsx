import type { OwnCommitmentView } from "@/modules/contribution/dto/guest-gift-dto";

/** Owner's answer 3 in phase 5: guests see what they chose, and only that. */
export function OwnCommitments({ items }: { items: OwnCommitmentView[] }) {
  if (items.length === 0) return null;
  return (
    <section
      aria-labelledby="own-title"
      className="border-rose-soft flex w-full flex-col gap-2 border-y py-4"
    >
      <h2 id="own-title" className="text-[0.95rem] tracking-[0.22em] uppercase">
        Lo que elegiste
      </h2>
      <ul className="flex flex-col gap-1.5">
        {items.map((item, index) => (
          <li key={index}>
            {item.kind === "claim"
              ? `Llevás: ${item.giftTitle}`
              : `Aportaste ${item.amountLabel} para ${item.giftTitle} (${
                  item.confirmed
                    ? "confirmado por los papás"
                    : "pendiente de confirmación"
                })`}
          </li>
        ))}
      </ul>
    </section>
  );
}
