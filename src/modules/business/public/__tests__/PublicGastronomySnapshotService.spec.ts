import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/core/business/services/PublicSnapshotRpcService", () => ({
  PublicSnapshotRpcService: {
    getGastronomySnapshotBySlug: vi.fn(),
  },
}));

import { PublicSnapshotRpcService } from "@/core/business/services/PublicSnapshotRpcService";
import { PublicGastronomySnapshotService } from "../services/PublicGastronomySnapshotService";
import type { PublicGastronomySnapshot } from "@/core/business/types/publicSnapshots";

describe("PublicGastronomySnapshotService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("consumes only PublicGastronomySnapshot RPC contract", async () => {
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
      gastronomy: {
        profile: { business_id: "business-data-1" },
        business: { profile_id: "profile-1", business_data_id: "business-data-1" },
        menu: { id: "menu-1", categories: [{ id: "cat-1", name: "Pratos", items: [{ id: "i-1" }] }] },
        promotions: [],
        hasUsefulMenuContent: true,
        commerce: {
          businessDataId: "business-data-1",
          deliveryEnabled: true,
          takeoutEnabled: true,
          dineInEnabled: true,
          minimumOrder: 25,
          deliveryFee: 8,
          currency: "BRL",
        },
      },
      seo: {
        title: "Restaurante Central - Cardapio e pedidos | Achegue-se",
        description: "Comida regional",
        canonical: "/empresas/ba/salvador/pituba/restaurante-central",
        robots: "index, follow",
        schemaType: "Restaurant",
        hasLocalBusinessSchema: true,
        hasRestaurantSchema: true,
        canonicalGastronomyUrl: "/empresas/ba/salvador/pituba/restaurante-central",
        canonicalBusinessUrl: "/empresas/ba/salvador/pituba/restaurante-central",
        shouldNoIndex: false,
      },
      routing: {},
    } as unknown as PublicGastronomySnapshot;

    vi.mocked(PublicSnapshotRpcService.getGastronomySnapshotBySlug).mockResolvedValue(rpcSnapshot);

    const snapshot = await PublicGastronomySnapshotService.getByTerritorySlug({
      state: "ba",
      city: "salvador",
      district: "pituba",
      slug: "restaurante-central",
    });

    expect(snapshot).not.toBeNull();
    expect(snapshot?.seo.canonicalBusinessUrl).toBe(
      "/empresas/ba/salvador/pituba/restaurante-central",
    );
    expect(snapshot?.seo.canonicalGastronomyUrl).toBe(
      "/empresas/ba/salvador/pituba/restaurante-central",
    );
    expect(snapshot?.seo.canonicalBusinessUrl).toBe(snapshot?.seo.canonicalGastronomyUrl);
    expect(snapshot?.gastronomy.commerce.businessDataId).toBe("business-data-1");
    expect(snapshot?.identity.profileId).toBe("profile-1");
    expect(vi.mocked(PublicSnapshotRpcService.getGastronomySnapshotBySlug)).toHaveBeenCalledTimes(1);
  });

  it("returns null when RPC has no gastronomy snapshot", async () => {
    vi.mocked(PublicSnapshotRpcService.getGastronomySnapshotBySlug).mockResolvedValue(null);

    const snapshot = await PublicGastronomySnapshotService.getByTerritorySlug({
      state: "ba",
      city: "salvador",
      district: "pituba",
      slug: "nao-existe",
    });

    expect(snapshot).toBeNull();
  });
});
