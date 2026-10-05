import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function source(path: string): string {
  return readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
}

describe("active provider registry dispatch", () => {
  it("keeps Map provider resolution explicit", () => {
    const mapRegistry = source("src/core/maps/providers/registry.ts");

    expect(mapRegistry).toContain('case "business":');
    expect(mapRegistry).toContain("return businessMapLayerProviderDefinition;");
    expect(mapRegistry).not.toContain("MAP_LAYER_PROVIDERS[providerId]");
  });

  it("keeps Nearby provider resolution explicit", () => {
    const nearbyRegistry = source("src/core/nearby/providers/registry.ts");

    expect(nearbyRegistry).toContain('case "business":');
    expect(nearbyRegistry).toContain("return businessNearbyProviderDefinition;");
    expect(nearbyRegistry).not.toContain("NEARBY_PROVIDERS[providerId]");
  });
});
