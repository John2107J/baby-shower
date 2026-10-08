import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GiftList } from "@/components/gifts/gift-list";
import { OwnCommitments } from "@/components/gifts/own-commitments";
import { Bow } from "@/components/invitation/bow";
import { InvitationCard } from "@/components/invitation/invitation-card";
import { Meadow } from "@/components/invitation/meadow";
import { WatercolorDefs } from "@/components/invitation/watercolor-defs";
import { getClientIp } from "@/lib/client-ip";
import { getDb } from "@/lib/db";
import { GUEST_ROUTES } from "@/lib/routes";
import {
  claimGiftAction,
  declareContributionAction,
} from "@/modules/contribution/services/gift-list-actions";
import { getGuestGiftList } from "@/modules/contribution/services/gift-list-service";

export const metadata: Metadata = { title: "Lista de regalos" };

export default async function GiftListPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const result = await getGuestGiftList(
    getDb(),
    token,
    getClientIp(await headers()),
  );
  if (result.status === "not_found") notFound();

  if (result.status === "event_not_ready") {
    return (
      <InvitationCard>
        <WatercolorDefs />
        <Bow untied={false} />
        <p className="pb-10">
          Estamos terminando de preparar esta invitación. Volvé a mirarla en
          unos días.
        </p>
      </InvitationCard>
    );
  }

  const list = result.list;
  return (
    <InvitationCard>
      <WatercolorDefs />
      <Link
        href={GUEST_ROUTES.invitation(token)}
        className="text-rose self-start text-[0.95rem] underline underline-offset-4"
      >
        Volver a la invitación
      </Link>
      <div className="flex flex-col items-center gap-1">
        <p className="text-[0.95rem] tracking-[0.22em] uppercase">
          Lista de regalos
        </p>
        <h1 className="text-rose font-[family-name:var(--font-script)] text-[clamp(2.8rem,12vw,3.6rem)] leading-[1.05] text-balance">
          {list.babyName}
        </h1>
      </div>
      <OwnCommitments items={list.ownCommitments} />
      <GiftList
        list={list}
        claimAction={claimGiftAction.bind(null, token)}
        contributeAction={declareContributionAction.bind(null, token)}
      />
      <Meadow />
    </InvitationCard>
  );
}
