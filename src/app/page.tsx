import { Bow } from "@/components/invitation/bow";
import { InvitationCard } from "@/components/invitation/invitation-card";
import { Meadow } from "@/components/invitation/meadow";
import { WatercolorDefs } from "@/components/invitation/watercolor-defs";

/** Shown to anyone who opens the site without their personal link. No event data. */
export default function HomePage() {
  return (
    <InvitationCard>
      <WatercolorDefs />
      <Bow untied={false} />
      <p className="text-[1.15rem] text-balance">
        Esta invitación es personal.
        <br />
        Usá el link que te enviaron.
      </p>
      <Meadow />
    </InvitationCard>
  );
}
