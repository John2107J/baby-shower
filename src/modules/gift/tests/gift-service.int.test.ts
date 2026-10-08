import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { MAX_IMAGE_BYTES } from "@/lib/image-storage/image-type";
import {
  archiveGift,
  createGiftFromForm,
  getGift,
  listGifts,
  reorderGift,
  updateGiftFromForm,
} from "@/modules/gift/services/gift-service";
import {
  JPEG_BYTES,
  PNG_BYTES,
  createFakeStorage,
  fileFrom,
} from "@/test/image-fixtures";
import { createTestDb, resetDatabase } from "@/test/test-db";

const db = createTestDb();
const VALUES = {
  title: "Cochecito",
  productUrl: "https://tienda.example.com/cochecito",
  referencePrice: "150000",
  quantity: "2",
};

beforeEach(() => resetDatabase(db));
afterAll(() => db.$disconnect());

async function createOk(
  storage = createFakeStorage().storage,
  title = VALUES.title,
) {
  const result = await createGiftFromForm(
    db,
    storage,
    { ...VALUES, title },
    fileFrom(JPEG_BYTES),
  );
  if (!result.ok) throw new Error("expected success");
  return result.id;
}

async function addClaim(giftId: string, units: number) {
  const invitation = await db.invitation.create({
    data: {
      token: `test-${crypto.randomUUID()}`,
      guestNames: ["Invitado de Prueba"],
    },
  });
  await db.giftClaim.create({
    data: {
      giftId,
      invitationId: invitation.id,
      units,
      idempotencyKey: crypto.randomUUID(),
    },
  });
}

describe("createGiftFromForm", () => {
  it("stores the photo under a random name and saves the gift", async () => {
    const { storage, stored } = createFakeStorage();
    const id = await createOk(storage);
    const gift = await getGift(db, id);
    expect(gift).toMatchObject({
      title: "Cochecito",
      referencePriceCents: 15_000_000,
      quantity: 2,
    });
    expect(gift?.imageUrl).toMatch(/\/gifts\/[0-9a-f-]{36}\.jpg$/);
    expect(gift?.imageUrl).not.toContain("foto");
    expect(stored.size).toBe(1);
  });

  it("requires a photo", async () => {
    const { storage, stored } = createFakeStorage();
    const result = await createGiftFromForm(db, storage, VALUES, null);
    expect(result).toMatchObject({
      ok: false,
      fieldErrors: { image: "Subí una foto del regalo." },
    });
    expect(stored.size).toBe(0);
  });

  it("rejects a file whose content is not an image, even if it claims to be a JPEG", async () => {
    const { storage, stored } = createFakeStorage();
    const fake = fileFrom(
      new TextEncoder().encode("<script>alert(1)</script>"),
      "x.jpg",
      "image/jpeg",
    );
    const result = await createGiftFromForm(db, storage, VALUES, fake);
    expect(result).toMatchObject({
      ok: false,
      fieldErrors: { image: expect.stringContaining("JPG") },
    });
    expect(stored.size).toBe(0);
  });

  it("rejects photos over 4 MB without uploading them", async () => {
    const { storage, stored } = createFakeStorage();
    const big = new Uint8Array(MAX_IMAGE_BYTES + 1);
    big.set(JPEG_BYTES);
    const result = await createGiftFromForm(db, storage, VALUES, fileFrom(big));
    expect(result).toMatchObject({
      ok: false,
      fieldErrors: { image: expect.stringContaining("4 MB") },
    });
    expect(stored.size).toBe(0);
  });

  it("reports form and photo errors together and saves nothing", async () => {
    const { storage } = createFakeStorage();
    const result = await createGiftFromForm(
      db,
      storage,
      { ...VALUES, title: "" },
      null,
    );
    expect(result).toMatchObject({
      ok: false,
      fieldErrors: { title: expect.any(String), image: expect.any(String) },
    });
    expect(await db.gift.count()).toBe(0);
  });

  it("deletes the uploaded photo if saving the gift fails", async () => {
    const { storage, stored, deleted } = createFakeStorage();
    await db.$executeRawUnsafe(
      `ALTER TABLE "Gift" ADD CONSTRAINT "test_block" CHECK (false) NOT VALID`,
    );
    try {
      await expect(
        createGiftFromForm(db, storage, VALUES, fileFrom(JPEG_BYTES)),
      ).rejects.toThrow();
    } finally {
      await db.$executeRawUnsafe(
        `ALTER TABLE "Gift" DROP CONSTRAINT "test_block"`,
      );
    }
    expect(deleted).toHaveLength(1);
    expect(stored.size).toBe(0);
  });
});

describe("updateGiftFromForm", () => {
  it("updates the data and keeps the photo when no new one is chosen", async () => {
    const { storage, deleted } = createFakeStorage();
    const id = await createOk(storage);
    const before = await getGift(db, id);
    const result = await updateGiftFromForm(
      db,
      storage,
      id,
      { ...VALUES, title: "Cuna", quantity: "1" },
      null,
    );
    expect(result).toEqual({ ok: true, id });
    const after = await getGift(db, id);
    expect(after).toMatchObject({
      title: "Cuna",
      quantity: 1,
      imageUrl: before?.imageUrl,
    });
    expect(deleted).toHaveLength(0);
  });

  it("replaces the photo and deletes the old one", async () => {
    const { storage, deleted } = createFakeStorage();
    const id = await createOk(storage);
    const oldUrl = (await getGift(db, id))?.imageUrl;
    await updateGiftFromForm(
      db,
      storage,
      id,
      VALUES,
      fileFrom(PNG_BYTES, "nueva.png", "image/png"),
    );
    const newUrl = (await getGift(db, id))?.imageUrl;
    expect(newUrl).toMatch(/\.png$/);
    expect(deleted).toEqual([oldUrl]);
  });

  it("does not allow a quantity below the units already reserved", async () => {
    const { storage, deleted } = createFakeStorage();
    const id = await createOk(storage);
    await addClaim(id, 2);
    const result = await updateGiftFromForm(
      db,
      storage,
      id,
      { ...VALUES, quantity: "1" },
      fileFrom(PNG_BYTES),
    );
    expect(result).toEqual({
      ok: false,
      reason: "invalid",
      fieldErrors: {
        quantity: "Ya hay 2 reservada(s): la cantidad no puede ser menor.",
      },
    });
    expect((await getGift(db, id))?.quantity).toBe(2);
    // The new photo uploaded for the rejected edit is cleaned up.
    expect(deleted).toHaveLength(1);
  });

  it("allows a quantity equal to the units already reserved", async () => {
    const { storage } = createFakeStorage();
    const id = await createOk(storage);
    await addClaim(id, 1);
    expect(
      await updateGiftFromForm(
        db,
        storage,
        id,
        { ...VALUES, quantity: "1" },
        null,
      ),
    ).toEqual({ ok: true, id });
  });

  it.each(["not-a-uuid", "00000000-0000-4000-8000-00000000abcd"])(
    "returns not_found for unknown gift %j",
    async (id) => {
      const { storage } = createFakeStorage();
      expect(await updateGiftFromForm(db, storage, id, VALUES, null)).toEqual({
        ok: false,
        reason: "not_found",
      });
    },
  );
});

describe("archiving and ordering", () => {
  it("archives and restores a gift, keeping it in the admin list", async () => {
    const id = await createOk();
    expect(await archiveGift(db, id, true)).toBe(true);
    expect((await getGift(db, id))?.archivedAt).toBeInstanceOf(Date);
    expect(await archiveGift(db, id, false)).toBe(true);
    expect((await getGift(db, id))?.archivedAt).toBeNull();
    expect(await listGifts(db)).toHaveLength(1);
  });

  it("moves gifts up and down, ignoring moves past the ends", async () => {
    const storage = createFakeStorage().storage;
    const a = await createOk(storage, "A");
    const b = await createOk(storage, "B");
    const c = await createOk(storage, "C");
    const titles = async () => (await listGifts(db)).map((gift) => gift.title);

    expect(await titles()).toEqual(["A", "B", "C"]);
    await reorderGift(db, c, "up");
    expect(await titles()).toEqual(["A", "C", "B"]);
    await reorderGift(db, a, "down");
    expect(await titles()).toEqual(["C", "A", "B"]);
    await reorderGift(db, c, "up");
    await reorderGift(db, b, "down");
    expect(await titles()).toEqual(["C", "A", "B"]);
  });

  it("keeps a consistent order under concurrent moves", async () => {
    const storage = createFakeStorage().storage;
    const ids = [];
    for (const title of ["A", "B", "C", "D"])
      ids.push(await createOk(storage, title));
    await Promise.all(
      ids.map((id, index) => reorderGift(db, id, index % 2 ? "up" : "down")),
    );
    const orders = (
      await db.gift.findMany({ select: { sortOrder: true } })
    ).map((g) => g.sortOrder);
    expect(orders.sort()).toEqual([0, 1, 2, 3]);
  });
});
