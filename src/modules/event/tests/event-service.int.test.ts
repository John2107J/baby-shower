import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { EVENT_ID } from "@/modules/event/repositories/event-repository";
import {
  getEventFormValues,
  saveEventFromForm,
} from "@/modules/event/services/event-service";
import { VALID_EVENT_FORM } from "@/modules/event/tests/fixtures";
import { createTestDb, resetDatabase } from "@/test/test-db";

const db = createTestDb();

beforeEach(() => resetDatabase(db));
afterAll(() => db.$disconnect());

describe("event service", () => {
  it("returns empty values before the event is created", async () => {
    expect((await getEventFormValues(db)).babyName).toBe("");
  });

  it("creates the event, storing the start time in UTC", async () => {
    expect(await saveEventFromForm(db, VALID_EVENT_FORM)).toEqual({ ok: true });
    const stored = await db.event.findUniqueOrThrow({
      where: { id: EVENT_ID },
    });
    expect(stored.startsAt.toISOString()).toBe("2030-01-15T19:30:00.000Z");
  });

  it("round-trips the values shown in the form", async () => {
    await saveEventFromForm(db, VALID_EVENT_FORM);
    expect(await getEventFormValues(db)).toEqual(VALID_EVENT_FORM);
  });

  it("updates the same row instead of creating a new one", async () => {
    await saveEventFromForm(db, VALID_EVENT_FORM);
    await saveEventFromForm(db, {
      ...VALID_EVENT_FORM,
      babyName: "Otro Nombre",
    });
    expect(await db.event.count()).toBe(1);
    expect((await getEventFormValues(db)).babyName).toBe("Otro Nombre");
  });

  it("never creates two events under concurrent first saves", async () => {
    const results = await Promise.allSettled(
      Array.from({ length: 5 }, () => saveEventFromForm(db, VALID_EVENT_FORM)),
    );
    expect(results.some((result) => result.status === "fulfilled")).toBe(true);
    expect(await db.event.count()).toBe(1);
  });

  it("returns field errors and saves nothing when the form is invalid", async () => {
    const result = await saveEventFromForm(db, {
      ...VALID_EVENT_FORM,
      babyName: "",
      city: "",
    });
    expect(result).toEqual({
      ok: false,
      fieldErrors: {
        babyName: "Ingresá el nombre de la bebé.",
        city: "Ingresá la ciudad o localidad.",
      },
    });
    expect(await db.event.count()).toBe(0);
  });

  it("clears optional fields when they are emptied", async () => {
    await saveEventFromForm(db, VALID_EVENT_FORM);
    await saveEventFromForm(db, {
      ...VALID_EVENT_FORM,
      venueName: "",
      mapsUrl: "",
    });
    const stored = await db.event.findUniqueOrThrow({
      where: { id: EVENT_ID },
    });
    expect(stored.venueName).toBeNull();
    expect(stored.mapsUrl).toBeNull();
  });
});
