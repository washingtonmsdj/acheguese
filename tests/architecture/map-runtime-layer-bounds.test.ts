import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("map runtime bounded reads", () => {
  const services = readProjectFile(
    "src/core/maps/services/MapServicesLayerRuntimeService.ts",
  );
  const classifiedsLayer = readProjectFile(
    "src/core/maps/services/MapClassifiedsLayerRuntimeService.ts",
  );
  const classifiedsQuery = readProjectFile(
    "src/core/classifieds/services/classifieds.map-queries.ts",
  );

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
