import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("map runtime bounded reads", () => {
  const gastronomy = readProjectFile(
    "src/core/maps/services/MapGastronomyLayerRuntimeService.ts",
  );
  const services = readProjectFile(
    "src/core/maps/services/MapServicesLayerRuntimeService.ts",
  );
  const classifiedsLayer = readProjectFile(
    "src/core/maps/services/MapClassifiedsLayerRuntimeService.ts",
  );
  const classifiedsQuery = readProjectFile(
    "src/core/classifieds/services/classifieds.map-queries.ts",
  );

  it("reads gastronomy candidates from the bounded public Business projection", () => {
    expect(gastronomy).toContain(
      '.from<PublicBusinessGastronomyRow>("public_business_search")',
    );
    expect(gastronomy).toContain('.eq("has_active_gastronomy_profile", true)');
    expect(gastronomy).toContain('.gte("longitude", west)');
    expect(gastronomy).toContain('.lte("longitude", east)');
    expect(gastronomy).toContain('.gte("latitude", south)');
    expect(gastronomy).toContain('.lte("latitude", north)');
    expect(gastronomy).toContain(
      'applyTerritoryFilter(businessQuery, territoryFilter)',
    );
    expect(gastronomy).toContain('.limit(limit)');
    expect(gastronomy).toContain(
      '.from<GastronomyProfileRow>("gastronomy_profiles")',
    );
    expect(gastronomy).toContain('.in("business_id", businessIds)');
    expect(gastronomy).not.toContain('.from<GastronomyMapRow>("business_data")');
    expect(gastronomy).not.toContain("isInsideBounds");
    expect(gastronomy).not.toContain("limit * 3");
  });

  it("reads public professionals by viewport before limiting", () => {
    expect(services).toContain('.from<ServiceMapRow>("public_professional_search")');
    expect(services).toContain('.gte("longitude", west)');
    expect(services).toContain('.lte("longitude", east)');
    expect(services).toContain('.gte("latitude", south)');
    expect(services).toContain('.lte("latitude", north)');
    expect(services).toContain('applyTerritoryFilter(query, territoryFilter)');
    expect(services).toContain('.limit(limit)');
    expect(services).not.toContain('.from<ServiceMapRow>("professional_data")');
    expect(services).not.toContain("isInsideBounds");
  });

  it("keeps classified spatial filtering inside the Classifieds owner", () => {
    expect(classifiedsLayer).toContain(
      'from "@/core/classifieds/services/classifieds.map-queries"',
    );
    expect(classifiedsLayer).not.toContain("getAllClassifieds");
    expect(classifiedsLayer).not.toContain("isInsideBounds");

    expect(classifiedsQuery).toContain('.gte("longitude", west)');
    expect(classifiedsQuery).toContain('.lte("longitude", east)');
    expect(classifiedsQuery).toContain('.gte("latitude", south)');
    expect(classifiedsQuery).toContain('.lte("latitude", north)');
    expect(classifiedsQuery).toContain('.limit(limit)');
    expect(classifiedsQuery).toContain("resolveLocationDescendants(territoryFilter)");
    expect(classifiedsQuery).toContain("reach.eq.city");
  });
});
