import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../services/PublicSnapshotRpcService", () => ({
  PublicSnapshotRpcService: {
    getBusinessSnapshotBySlug: vi.fn(),
  },
}));

import { PublicSnapshotRpcService } from "../services/PublicSnapshotRpcService";
import { PublicBusinessSnapshotService } from "../services/PublicBusinessSnapshotService";
import type { PublicBusinessSnapshot } from "../types/publicSnapshots";

describe("PublicBusinessSnapshotService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("consumes only PublicBusinessSnapshot RPC contract", async () => {
    const rpcSnapshot = {
      identity: {
        profileId: "profile-1",
        businessId: "business-data-1",
        slug: "restaurante-central",
        displayName: "Restaurante Central",
        canonicalBusinessUrl: "/empresas/ba/salvador/pituba/restaurante-central",
      },
      institutional: {
        name: "Restaurante Central",
        description: "Comida regional",
        category: "restaurante",
        subcategory: null,
        photos: ["/banner.jpg"],
        addressText: "Rua A, 10",
        locationText: "Pituba, Salvador - BA",
        openStatus: { open: true, todayHours: "11:00 - 22:00" },
        rating: 4.7,
        reviewCount: 25,
        business: {
          id: "profile-1",
          profile_id: "profile-1",
        },
      },
      verticals: {
        activeVerticals: ["gastronomy"],
        primaryVertical: "gastronomy",
        canonicalVerticalUrl: "/empresas/ba/salvador/pituba/restaurante-central",
        verticalPublicUrls: {
          gastronomy: "/empresas/ba/salvador/pituba/restaurante-central",
        },
      },
      gastronomyPreview: [
        {
          id: "item-1",
          name: "Moqueca",
          imageUrl: "/m.jpg",
          priceFrom: 42,
          priceLabel: "A partir de R$ 42,00",
          menuUrl: "/empresas/ba/salvador/pituba/restaurante-central",
        },
      ],
      seo: {
        title: "Restaurante Central | Achegue-se",
        description: "Comida regional",
        canonical: "/empresas/ba/salvador/pituba/restaurante-central",
        robots: "index, follow",
        schemaType: "Restaurant",
        hasLocalBusinessSchema: true,
        hasRestaurantSchema: true,
      },
      routing: {},
    } as unknown as PublicBusinessSnapshot;

    vi.mocked(PublicSnapshotRpcService.getBusinessSnapshotBySlug).mockResolvedValue(rpcSnapshot);

    const snapshot = await PublicBusinessSnapshotService.getByTerritorySlug({
      state: "ba",
      city: "salvador",
      district: "pituba",
      slug: "restaurante-central",
    });

    expect(snapshot).not.toBeNull();
    expect(snapshot?.gastronomyPreview).toHaveLength(1);
    expect(snapshot?.verticals.canonicalVerticalUrl).toBe(
      "/empresas/ba/salvador/pituba/restaurante-central",
    );
    expect(snapshot?.institutional.business.id).toBe("profile-1");
    expect(vi.mocked(PublicSnapshotRpcService.getBusinessSnapshotBySlug)).toHaveBeenCalledTimes(1);
  });

  it("returns null when RPC does not resolve a public snapshot", async () => {
    vi.mocked(PublicSnapshotRpcService.getBusinessSnapshotBySlug).mockResolvedValue(null);

    const snapshot = await PublicBusinessSnapshotService.getByTerritorySlug({
      state: "ba",
      city: "salvador",
      district: "pituba",
      slug: "nao-existe",
    });

    expect(snapshot).toBeNull();
  });

  it("uses the Tone Pizzaria dev fixture without calling the public snapshot RPC", async () => {
    const snapshot = await PublicBusinessSnapshotService.getByTerritorySlug({
      state: "ba",
      city: "salvador",
      district: "complexo-do-nordeste-de-amaralina",
      slug: "tone-cos-loja",
    });

    expect(snapshot?.identity.businessId).toBe("00000000-0000-4000-8000-000000000101");
    expect(snapshot?.institutional.name).toBe("Ton\u00e9 Pizzaria");
    expect(snapshot?.seo.canonical).toBe(
      "/empresas/ba/salvador/complexo-do-nordeste-de-amaralina/tone-cos-loja",
    );
    expect(vi.mocked(PublicSnapshotRpcService.getBusinessSnapshotBySlug)).not.toHaveBeenCalled();
  });
});
