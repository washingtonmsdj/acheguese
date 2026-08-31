import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(__dirname, "../..");
const read = (path: string) => readFileSync(resolve(repoRoot, path), "utf8");

describe("location descendant read model SSOT", () => {
  it("keeps id-only territory expansion on the canonical hierarchy read service", () => {
    const resolver = read(
      "src/core/location/utils/resolveLocationDescendants.ts",
    );
    const service = read(
      "src/core/location/services/LocationHierarchyReadService.ts",
    );
    const locationIndex = read("src/core/location/index.ts");
    const businessQueries = read(
      "src/core/business/services/business.queries.ts",
    );

    expect(resolver).toContain(
      "LocationHierarchyReadService.getDescendantIds",
    );
    expect(resolver).not.toContain("createLocationRepository");
    expect(resolver).not.toContain("findDescendants(");
    expect(resolver).not.toContain("page_size");

    expect(service).toContain('"rpc_get_location_descendants_ids"');
    expect(service).toContain("p_location_id: locationId");
    expect(service).not.toContain('.from("locations")');
    expect(service).not.toContain("count: \"exact\"");

    expect(locationIndex).toContain(
      "export { LocationHierarchyReadService } from './services/LocationHierarchyReadService';",
    );

    expect(businessQueries).toContain(
      "LocationHierarchyReadService.getDescendantIds",
    );
    expect(businessQueries).not.toContain(
      'supabase.rpc(\n        "rpc_get_location_descendants_ids"',
    );
  });
});
