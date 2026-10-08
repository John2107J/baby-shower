import { describe, expect, it } from "vitest";
import { formatCentsAsArs } from "@/lib/money";
import {
  toGuestGiftListView,
  toPublicGiftView,
} from "@/modules/contribution/dto/guest-gift-dto";
import type { PublicGiftRecord } from "@/modules/contribution/repositories/gift-list-repository";

const UNIT = 100_000_00;
const gift = (
  commitments: Partial<PublicGiftRecord["commitments"]> = {},
): PublicGiftRecord => ({
  id: "6f1c1a52-6f62-4b39-9d4c-6f0d0d3f8a10",
  title: "Cochecito",
  imageUrl: "https://example.com/foto.jpg",
  productUrl: "https://tienda.example.com/cochecito",
  unitPriceCents: UNIT,
  quantity: 2,
  sortOrder: 0,
  commitments: {
    quantity: 2,
    unitPriceCents: UNIT,
    claimedUnits: 0,
    confirmedCents: 0,
    pendingCents: 0,
    ...commitments,
  },
});

describe("toPublicGiftView", () => {
  it("shows the bar of the current unit (decision 39)", () => {
    expect(
      toPublicGiftView(gift({ confirmedCents: 130_000_00 })),
    ).toMatchObject({
      unitPriceLabel: formatCentsAsArs(UNIT),
      progress: {
        state: "open",
        unitLabel: "Unidad 2 de 2",
        percent: 30,
        missingLabel: formatCentsAsArs(70_000_00),
        canClaim: false,
        minContributionCents: 1_000_00,
        maxContributionCents: 70_000_00,
      },
    });
  });

  it("omits the unit label for single-unit gifts", () => {
    const single = gift({ quantity: 1 });
    expect(toPublicGiftView({ ...single, quantity: 1 }).progress).toMatchObject(
      {
        unitLabel: null,
      },
    );
  });

  it("exposes exactly the aggregated fields, never sums per guest (CLAUDE.md §3.5)", () => {
    const view = toPublicGiftView(gift({ pendingCents: 12_345_00 }));
    expect(Object.keys(view).sort()).toEqual(
      [
        "id",
        "imageUrl",
        "productUrl",
        "progress",
        "quantity",
        "title",
        "unitPriceLabel",
      ].sort(),
    );
    expect(Object.keys(view.progress).sort()).toEqual(
      [
        "canClaim",
        "maxContributionCents",
        "maxContributionLabel",
        "minContributionCents",
        "missingLabel",
        "percent",
        "state",
        "unitLabel",
      ].sort(),
    );
    expect(JSON.stringify(view)).not.toContain("12.345");
  });
});

describe("toGuestGiftListView", () => {
  const event = {
    babyName: "Bebé de Prueba",
    startsAt: new Date("2030-01-15T19:30:00Z"),
    venueName: null,
    streetAddress: "Calle Falsa 123",
    city: "Ciudad de Prueba",
    mapsUrl: null,
    paymentAlias: "alias.de.prueba",
    paymentCbu: "2850590940090418135201",
    paymentHolderName: "Titular de Prueba",
  };

  it("sends payment data and the gifts, but no address or other event details", () => {
    const view = toGuestGiftListView(event, true, [gift()], []);
    expect(Object.keys(view).sort()).toEqual(
      ["babyName", "gifts", "open", "ownCommitments", "payment"].sort(),
    );
    expect(view.payment).toEqual({
      alias: "alias.de.prueba",
      cbu: "2850590940090418135201",
      holderName: "Titular de Prueba",
    });
  });

  it("shows the guest's own choices without dates or ids", () => {
    const createdAt = new Date("2030-01-10T12:00:00Z");
    const view = toGuestGiftListView(
      event,
      true,
      [],
      [
        { kind: "claim", giftTitle: "Cuna", units: 1, createdAt },
        {
          kind: "contribution",
          giftTitle: "Cochecito",
          amountCents: 5_000_00,
          status: "DECLARED",
          createdAt,
        },
      ],
    );
    expect(view.ownCommitments).toEqual([
      { kind: "claim", giftTitle: "Cuna" },
      {
        kind: "contribution",
        giftTitle: "Cochecito",
        amountLabel: formatCentsAsArs(5_000_00),
        confirmed: false,
      },
    ]);
  });
});
