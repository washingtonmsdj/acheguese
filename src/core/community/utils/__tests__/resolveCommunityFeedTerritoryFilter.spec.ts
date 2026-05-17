import { describe, expect, it } from "vitest";
import type { TerritoryFilter } from "@/core/location";
import type { ResolvedTerritory } from "@/core/routing/hooks/useResolveTerritoryFromUrl";
import { resolveCommunityFeedTerritoryFilter } from "@/core/community/utils/resolveCommunityFeedTerritoryFilter";

const CITY_RESOLVED: ResolvedTerritory = {
  kind: "location",
  location: {
    id: "city-1",
    type: "city",
    parent_id: "state-1",
    slug: "salvador",
    name: "Salvador",
    full_name: "Salvador",
    geographic_path: "/br/ba/salvador",
    status: "active",
    metadata: {},
    created_at: "",
    updated_at: "",
  } as never,
};

const DISTRICT_RESOLVED: ResolvedTerritory = {
  kind: "location",
  location: {
    id: "district-1",
    type: "district",
    parent_id: "city-1",
    slug: "chapada-do-rio-vermelho",
    name: "Chapada do Rio Vermelho",
    full_name: "Chapada do Rio Vermelho",
    geographic_path: "/br/ba/salvador/chapada-do-rio-vermelho",
    status: "active",
    metadata: {},
    created_at: "",
    updated_at: "",
  } as never,
};

describe("resolveCommunityFeedTerritoryFilter", () => {
  it("keeps group filter unchanged for every scope", () => {
    const groupFilter: TerritoryFilter = { scope: "group", location_ids: ["district-1", "district-2"] };

    expect(
      resolveCommunityFeedTerritoryFilter({
        baseFilter: groupFilter,
        locationScope: "city",
        resolved: DISTRICT_RESOLVED,
      }),
    ).toEqual(groupFilter);

    expect(
      resolveCommunityFeedTerritoryFilter({
        baseFilter: groupFilter,
        locationScope: "neighborhood",
        resolved: DISTRICT_RESOLVED,
      }),
    ).toEqual(groupFilter);
  });

  it("uses resolved city when scope is city", () => {
    expect(
      resolveCommunityFeedTerritoryFilter({
        baseFilter: { scope: "none" },
        locationScope: "city",
        resolved: CITY_RESOLVED,
      }),
    ).toEqual({ scope: "location", location_id: "city-1" });
  });

  it("uses district parent city when scope is city and route resolved district", () => {
    expect(
      resolveCommunityFeedTerritoryFilter({
        baseFilter: { scope: "none" },
        locationScope: "city",
        resolved: DISTRICT_RESOLVED,
      }),
    ).toEqual({ scope: "location", location_id: "city-1" });
  });

  it("uses resolved district when scope is neighborhood", () => {
    expect(
      resolveCommunityFeedTerritoryFilter({
        baseFilter: { scope: "none" },
        locationScope: "neighborhood",
        resolved: DISTRICT_RESOLVED,
      }),
    ).toEqual({ scope: "location", location_id: "district-1" });
  });

  it("falls back to home city or district when route does not resolve this level", () => {
    expect(
      resolveCommunityFeedTerritoryFilter({
        baseFilter: { scope: "none" },
        locationScope: "city",
        resolved: null,
        homeCityId: "home-city",
      }),
    ).toEqual({ scope: "location", location_id: "home-city" });

    expect(
      resolveCommunityFeedTerritoryFilter({
        baseFilter: { scope: "none" },
        locationScope: "neighborhood",
        resolved: CITY_RESOLVED,
        homeDistrictId: "home-district",
      }),
    ).toEqual({ scope: "location", location_id: "home-district" });
  });

  it("returns base filter when no conversion rule matches", () => {
    const baseFilter: TerritoryFilter = { scope: "none" };

    expect(
      resolveCommunityFeedTerritoryFilter({
        baseFilter,
        locationScope: "street",
        resolved: DISTRICT_RESOLVED,
      }),
    ).toEqual(baseFilter);
  });
});
