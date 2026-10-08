import type { MetadataRoute } from "next";

// Link-preview bots may read invitations to build the WhatsApp/Telegram card
// (decision 34); every other crawler is kept out. Pages also send
// "X-Robots-Tag: noindex", so nothing is indexed either way.
const LINK_PREVIEW_BOTS = [
  "facebookexternalhit",
  "WhatsApp",
  "TelegramBot",
  "Twitterbot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: LINK_PREVIEW_BOTS, allow: "/i/" },
      { userAgent: "*", disallow: "/" },
    ],
  };
}
