import { describe, expect, it } from "vitest";
import {
  buildShareMessage,
  gmailComposeUrl,
  mailtoUrl,
  whatsappShareUrl,
} from "@/modules/invitation/domain/share-message";

const LINK = "https://ejemplo.vercel.app/i/AbC_-123";
const message = (guestNames: string[]) =>
  buildShareMessage({ guestNames, babyName: "Bebé de Prueba", link: LINK });

describe("buildShareMessage", () => {
  it("greets one name or a family", () => {
    expect(message(["Familia Pérez"])).toEqual({
      subject: "Invitación al Baby Shower de Bebé de Prueba",
      body: [
        "¡Hola, Familia Pérez!",
        "Esta es la invitación al Baby Shower de Bebé de Prueba. En este link podés confirmar asistencia y ver la lista de regalos:",
        LINK,
      ].join("\n"),
    });
  });

  it("lists up to five names", () => {
    expect(message(["Ana", "Luis", "Sofía", "Tomás", "Ñandú"]).body).toMatch(
      /^¡Hola, Ana, Luis, Sofía, Tomás y Ñandú!\n/,
    );
  });
});

describe("share URLs", () => {
  const tricky = message(["Ana & Luis", "José?"]);

  it.each([
    ["WhatsApp", whatsappShareUrl(tricky), "text"],
    ["Gmail", gmailComposeUrl(tricky), "body"],
    ["mail app", mailtoUrl(tricky), "body"],
  ])(
    "%s keeps the text intact (accents, &, ?, line breaks)",
    (_name, url, key) => {
      const query = url.slice(url.indexOf("?") + 1);
      expect(new URLSearchParams(query).get(key)).toBe(tricky.body);
    },
  );

  it("uses wa.me without a phone number", () => {
    expect(whatsappShareUrl(tricky)).toMatch(/^https:\/\/wa\.me\/\?text=/);
  });

  it("fills the subject of both mail links", () => {
    for (const [url, key] of [
      [gmailComposeUrl(tricky), "su"],
      [mailtoUrl(tricky), "subject"],
    ] as const) {
      const query = url.slice(url.indexOf("?") + 1);
      expect(new URLSearchParams(query).get(key)).toBe(tricky.subject);
    }
    expect(gmailComposeUrl(tricky)).toMatch(
      /^https:\/\/mail\.google\.com\/mail\/\?view=cm&fs=1&/,
    );
    expect(mailtoUrl(tricky)).toMatch(/^mailto:\?subject=/);
  });
});
