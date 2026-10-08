import { ImageResponse } from "next/og";
import { getDb } from "@/lib/db";
import { PREVIEW_BOW_SVG, loadPreviewFonts } from "@/lib/og-assets";
import { findEvent } from "@/modules/event/repositories/event-repository";

export const alt = "Invitación al baby shower";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Link preview for WhatsApp and other apps (decision 34). It never depends on
 * the token, so it reveals nothing about the guest and cannot be used to test
 * whether a link exists.
 */
export default async function InvitationPreviewImage() {
  const [event, fonts] = await Promise.all([
    findEvent(getDb()),
    loadPreviewFonts(),
  ]);
  const bow = `data:image/svg+xml;base64,${Buffer.from(PREVIEW_BOW_SVG).toString("base64")}`;
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#f9f6f2",
        color: "#574b44",
      }}
    >
      <img src={bow} width={330} height={255} alt="" />
      <div
        style={{
          fontFamily: "Quicksand",
          fontSize: 44,
          letterSpacing: 4,
          marginTop: 24,
        }}
      >
        {event ? "Baby Shower de" : "Baby Shower"}
      </div>
      {event && (
        <div
          style={{
            fontFamily: "Allura",
            fontSize: 120,
            color: "#b7837f",
            lineHeight: 1.1,
          }}
        >
          {event.babyName}
        </div>
      )}
    </div>,
    { ...size, fonts },
  );
}
