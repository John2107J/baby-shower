import { describe, expect, it } from "vitest";
import { parseRsvpForm } from "@/modules/rsvp/schemas/rsvp-form";

const form = (fields: Record<string, string>) => {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
};

describe("parseRsvpForm", () => {
  it.each(["1", "6"])("accepts yes with %s attendees", (attendees) => {
    expect(parseRsvpForm(form({ answer: "yes", attendees }))).toEqual({
      attending: true,
      attendees: Number(attendees),
    });
  });

  it("accepts no and ignores any attendee count sent with it", () => {
    expect(parseRsvpForm(form({ answer: "no", attendees: "5" }))).toEqual({
      attending: false,
      attendees: 0,
    });
  });

  it.each([
    { answer: "yes", attendees: "0" },
    { answer: "yes", attendees: "7" },
    { answer: "yes", attendees: "-1" },
    { answer: "yes", attendees: "2.5" },
    { answer: "yes" },
    { answer: "maybe", attendees: "2" },
    {},
  ])("rejects %j", (fields) => {
    expect(parseRsvpForm(form(fields as Record<string, string>))).toBeNull();
  });
});
