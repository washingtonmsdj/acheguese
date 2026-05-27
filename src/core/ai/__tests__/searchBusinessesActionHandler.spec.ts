import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AIIntent } from "../domain/types";
import { SearchBusinessesActionHandler } from "../actions/SearchBusinessesActionHandler";

const mocks = vi.hoisted(() => ({
  getBusinessesList: vi.fn(),
  getBusinessesByIds: vi.fn(),
  getShareUrl: vi.fn(),
  searchHybrid: vi.fn(),
}));

vi.mock("@/core/business", () => ({
  BusinessService: {
    getBusinessesList: mocks.getBusinessesList,
    getBusinessesByIds: mocks.getBusinessesByIds,
  },
  BusinessUrlService: {
    getShareUrl: mocks.getShareUrl,
  },
}));

vi.mock("@/core/geospatial", () => ({
  spatialSearchService: {
    searchHybrid: mocks.searchHybrid,
  },
}));

const baseIntent: AIIntent = {
  type: "business_search",
  query: "pizzaria barata com delivery",
  normalizedQuery: "pizzaria",
  confidence: 0.8,
  filters: { tags: [], radiusKm: 12, category: "restaurante" },
  source: "fallback",
};

describe("SearchBusinessesActionHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getShareUrl.mockReturnValue("/p/teste");
  });

  it("chama BusinessService em business_search", async () => {
    mocks.getBusinessesList.mockResolvedValue({
      businesses: [],
      nextPage: undefined,
    });

    const handler = new SearchBusinessesActionHandler();
    await handler.execute(baseIntent, {
      locationId: "loc-1",
      territoryFilter: { scope: "location", location_id: "loc-1" },
    });

    expect(mocks.getBusinessesList).toHaveBeenCalledTimes(1);
  });

  it("respeita location_id no fallback territorial", async () => {
    mocks.getBusinessesList.mockResolvedValue({
      businesses: [],
      nextPage: undefined,
    });

    const handler = new SearchBusinessesActionHandler();
    await handler.execute(baseIntent, {
      locationId: "loc-bairro-123",
      territoryFilter: { scope: "location", location_id: "loc-bairro-123" },
    });

    expect(mocks.getBusinessesList).toHaveBeenCalledWith(
      expect.objectContaining({
        filter: { scope: "location", location_id: "loc-bairro-123" },
      }),
    );
  });

  it("aciona SpatialSearchService com coordenadas e radiusKm", async () => {
    mocks.searchHybrid.mockResolvedValue([
      { id: "biz-1", distance_meters: 350, name: "Biz 1", latitude: 0, longitude: 0 },
    ]);
    mocks.getBusinessesByIds.mockResolvedValue([
      {
        id: "biz-1",
        name: "Pizzaria Real",
        category: "restaurante",
        slug: "pizzaria-real",
        rating: 4.8,
        is_premium: true,
        verified: true,
        geographic_path: "/br/ba/salvador/pituba",
      },
    ]);

    const handler = new SearchBusinessesActionHandler();
    const items = await handler.execute(baseIntent, {
      locationId: "loc-pituba",
      coordinates: { latitude: -12.97, longitude: -38.5 },
      territoryFilter: { scope: "location", location_id: "loc-pituba" },
    });

    expect(mocks.searchHybrid).toHaveBeenCalledWith(
      expect.objectContaining({
        radiusKm: 12,
        locationIds: ["loc-pituba"],
      }),
    );
    expect(items.length).toBe(1);
  });
});
