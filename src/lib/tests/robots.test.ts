import { describe, expect, it } from "vitest";
import robots from "@/app/robots";

describe("robots.txt", () => {
  it("lets only link-preview bots read invitations and blocks everyone else", () => {
    const { rules } = robots();
    expect(rules).toEqual([
      {
        userAgent: [
          "facebookexternalhit",
          "WhatsApp",
          "TelegramBot",
          "Twitterbot",
        ],
        allow: "/i/",
      },
      { userAgent: "*", disallow: "/" },
    ]);
  });
});
