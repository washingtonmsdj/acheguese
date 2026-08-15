import { beforeEach, describe, expect, it, vi } from "vitest";
import { LocationStatus, LocationType, type Location } from "@/core/location/types";

const { repository } = vi.hoisted(() => ({
  repository: {
    findByPath: vi.fn(),
    findActiveStateByName: vi.fn(),
    findChildren: vi.fn(),
    findAll: vi.fn(),
  },
}));

vi.mock("@/core/location/repositories/createLocationRepository", () => ({
  createLocationRepository: () => repository,
}));

import { resolveCityToLocationIds } from "./territorialResolver";

function location(overrides: Partial<Location>): Location {
  return {
    id: "00000000-0000-0000-0000-000000000001",
    parent_id: null,
    type: LocationType.CITY,
    slug: "salvador",
    name: "Salvador",
    full_name: "Salvador, Bahia, Brasil",
    geographic_path: "/br/ba/salvador",
    status: LocationStatus.ACTIVE,
    metadata: {},
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("TerritorialResolver query path", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    repository.findByPath.mockImplementation((path: string) => {
      if (path === "/br/ba") {
        return Promise.resolve(
          location({
            id: "00000000-0000-0000-0000-000000000002",
            parent_id: "00000000-0000-0000-0000-000000000000",
            type: LocationType.STATE,
            slug: "ba",
            name: "Bahia",
            full_name: "Bahia, Brasil",
            geographic_path: "/br/ba",
          }),
        );
      }
      if (path === "/br/ba/salvador") {
        return Promise.resolve(location({}));
      }
      return Promise.resolve(null);
    });
    repository.findChildren.mockResolvedValue({ locations: [], total_count: 0 });
  });

  it("resolves state and city by indexed paths without loading all locations", async () => {
    const result = await resolveCityToLocationIds("BA", "Salvador");

    expect(result?.cityName).toBe("Salvador");
    expect(repository.findByPath).toHaveBeenNthCalledWith(1, "/br/ba");
    expect(repository.findByPath).toHaveBeenNthCalledWith(2, "/br/ba/salvador");
    expect(repository.findAll).not.toHaveBeenCalled();
  });

  it("does not fall back to a full-tree query for an unknown state", async () => {
    const result = await resolveCityToLocationIds("XX", "Cidade Inexistente");

    expect(result).toBeNull();
    expect(repository.findAll).not.toHaveBeenCalled();
    expect(repository.findChildren).not.toHaveBeenCalled();
  });
});
