import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { Bow } from "@/components/invitation/bow";
import { Meadow } from "@/components/invitation/meadow";
import { RsvpForm } from "@/components/invitation/rsvp-form";
import { WatercolorDefs } from "@/components/invitation/watercolor-defs";
import { getClientIp } from "@/lib/client-ip";
import { getDb } from "@/lib/db";
import { bodyFont, scriptFont } from "@/lib/fonts";
import { getGuestInvitation } from "@/modules/invitation/services/guest-invitation-service";
import { submitRsvpAction } from "@/modules/rsvp/services/rsvp-actions";

export const metadata: Metadata = { title: "Invitación" };

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${scriptFont.variable} ${bodyFont.variable} bg-paper-edge min-h-dvh px-4 py-6 font-[family-name:var(--font-body)] text-[17px] leading-normal`}
    >
      <main className="paper-grain bg-paper relative mx-auto flex max-w-[460px] flex-col items-center gap-7 overflow-hidden px-6 pt-10 text-center *:relative">
        {children}
      </main>
    </div>
  );
}

export default async function InvitationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const result = await getGuestInvitation(
    getDb(),
    token,
    getClientIp(await headers()),
  );
  if (result.status === "not_found") notFound();

  if (result.status === "event_not_ready") {
    return (
      <Card>
        <WatercolorDefs />
        <Bow untied={false} />
        <p className="pb-10">
          Estamos terminando de preparar esta invitación. Volvé a mirarla en
          unos días.
        </p>
      </Card>
    );
  }

  const invitation = result.invitation;
  return (
    <Card>
      <WatercolorDefs />
      <p className="text-[1.05rem] font-semibold text-balance">
        {invitation.guestNamesLabel}
      </p>
      <p className="text-[1.25rem] tracking-[0.06em] text-balance">
        Te invitamos al Baby Shower
        <br />
        de nuestra hija
      </p>
      <h1 className="text-rose -mt-2 font-[family-name:var(--font-script)] text-[clamp(3.4rem,15vw,4.6rem)] leading-[1.05] text-balance">
        {invitation.babyName}
      </h1>

      <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-3.5">
        <div className="border-rose-soft border-y py-3 text-[1.02rem] leading-tight">
          {invitation.weekday}
        </div>
        <div className="text-rose flex flex-col items-center">
          <b className="text-[3.2rem] leading-none font-medium">
            {invitation.dayOfMonth}
          </b>
          <span className="text-ink text-[0.85rem] tracking-[0.2em]">
            {invitation.month}
          </span>
        </div>
        <div className="border-rose-soft border-y py-3 text-[1.02rem] leading-tight">
          A partir de
          <br />
          las {invitation.time}
        </div>
      </div>

      <div className="flex flex-col items-center gap-1.5">
        <svg viewBox="0 0 18 24" className="h-6 w-[18px]" aria-hidden="true">
          <path
            d="M9 1 C4.6 1 1.5 4.3 1.5 8.5 C1.5 14 9 23 9 23 C9 23 16.5 14 16.5 8.5 C16.5 4.3 13.4 1 9 1 Z"
            fill="#e3b4ae"
          />
          <circle cx="9" cy="8.5" r="2.8" fill="#f9f6f2" />
        </svg>
        <p className="text-[1.15rem] tracking-[0.04em]">
          {invitation.venueName && (
            <>
              {invitation.venueName},
              <br />
            </>
          )}
          {invitation.streetAddress}
          <br />
          {invitation.city}
        </p>
        {invitation.mapsUrl && (
          <a
            href={invitation.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-rose text-[0.95rem] underline underline-offset-4"
          >
            Cómo llegar
          </a>
        )}
      </div>

      <RsvpForm
        action={submitRsvpAction.bind(null, token)}
        rsvp={invitation.rsvp}
        rsvpOpen={invitation.rsvpOpen}
        deadlineLabel={invitation.rsvpDeadlineLabel}
        maxAttendees={invitation.maxAttendees}
      />

      <Meadow />
    </Card>
  );
}
