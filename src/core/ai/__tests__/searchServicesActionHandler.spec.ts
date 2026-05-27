import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AIIntent } from "../domain/types";
import { SearchServicesActionHandler } from "../actions/SearchServicesActionHandler";

const mocks = vi.hoisted(() => ({
  getProfessionals: vi.fn(),
}));

vi.mock("@/core/professional", () => ({
  ProfessionalService: {
    getProfessionals: mocks.getProfessionals,
  },
}));

const serviceIntent: AIIntent = {
  type: "service_search",
  query: "eletricista perto de mim",
  normalizedQuery: "eletricista",
  confidence: 0.78,
  filters: { tags: [] },
  source: "fallback",
};

describe("SearchServicesActionHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna vazio controlado quando ProfessionalService falha", async () => {
    mocks.getProfessionals.mockRejectedValue(new Error("db down"));

    const handler = new SearchServicesActionHandler();
    const items = await handler.execute(serviceIntent, {
      locationId: "loc-1",
      territoryFilter: { scope: "location", location_id: "loc-1" },
    });

    expect(items).toEqual([]);
  });
});
