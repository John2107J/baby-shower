"use client";

import { useRef } from "react";
import { type GiftAction, GiftItem } from "@/components/gifts/gift-item";
import { GIFT_TEXTS } from "@/components/gifts/gift-list-texts";
import type { GuestGiftListView } from "@/modules/contribution/dto/guest-gift-dto";

export function GiftList({
  list,
  claimAction,
  contributeAction,
}: {
  list: GuestGiftListView;
  claimAction: GiftAction;
  contributeAction: GiftAction;
}) {
  const layerRef = useRef<HTMLDivElement>(null);
  return (
    <>
      {!list.open && (
        <p className="text-ink-soft text-balance">{GIFT_TEXTS.closed}</p>
      )}
      {list.gifts.length === 0 ? (
        <p className="text-ink-soft text-balance">
          Los papás todavía están armando la lista. Volvé a mirar en unos días.
        </p>
      ) : (
        <ul className="flex w-full flex-col gap-7">
          {list.gifts.map((gift) => (
            <GiftItem
              key={gift.id}
              gift={gift}
              payment={list.payment}
              listOpen={list.open}
              claimAction={claimAction}
              contributeAction={contributeAction}
              celebrationLayer={layerRef}
            />
          ))}
        </ul>
      )}
      <div
        ref={layerRef}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-10 overflow-hidden"
      />
    </>
  );
}
