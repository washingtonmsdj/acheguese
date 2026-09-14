import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const read = (p: string) => fs.readFileSync(path.join(ROOT, p), "utf8");

describe("territory entry progressive map performance", () => {
  it("keeps boundary infrastructure lazy and deduplicated", () => {
    const hook = read("src/core/maps/hooks/useTerritoryPolygon.ts");

    expect(hook).not.toContain('import { boundaryService } from "@/core/geospatial"');
    expect(hook).toContain("@/core/geospatial/services/BoundaryService");
    expect(hook).toContain("polygonCache");
    expect(hook).toContain("polygonPromises");
    expect(hook).toContain("POLYGON_CACHE_TTL_MS");
    expect(hook).toContain("preloadTerritoryPolygons");
  });

  it("does not reset MapLibre readiness when territory data arrives", () => {
    const runtime = read("src/app/components/territory-vivo/TerritoryEntryMapRuntime.tsx");
    expect(runtime).not.toContain("setMapReady(false)");
    expect(runtime).toContain('mapReady ? "opacity-100" : "opacity-0"');
    expect(runtime).not.toContain("duration-500");
  });

  it("preloads engine and official boundary concurrently", () => {
    const wrapper = read("src/app/components/territory-vivo/TerritoryEntryMap.tsx");
    const runtime = read("src/app/components/territory-vivo/TerritoryEntryMapRuntime.tsx");
    const owner = read("src/core/maps/components/v3/MapLibreAdapter.tsx");
    const passive = read("src/core/maps/components/v3/MapLibrePassiveRuntime.tsx");

    expect(wrapper).toContain("loadTerritoryEntryMapRuntime");
    expect(wrapper).toContain("preloadEntryMapStyle");
    expect(wrapper).toContain('link.rel = "preload"');
    expect(wrapper).toContain('link.as = "fetch"');
    expect(wrapper).toContain("Promise.all([");
    expect(wrapper).toContain("module.preloadTerritoryEntryMapEngine()");
    expect(wrapper).toContain("module.preloadTerritoryEntryBoundary(preloadResolved)");
    expect(wrapper).not.toContain("await module.preloadTerritoryEntryMapEngine()");

    expect(runtime).toContain("preloadPassiveMapLibreAdapterRuntime");
    expect(runtime).toContain("preloadTerritoryPolygons");
    expect(runtime).toContain("preloadTerritoryEntryBoundary");
    expect(runtime).toContain('from "@/core/maps/components/v3/MapLibreAdapter"');
    expect(runtime).not.toContain("LazyMapLibreAdapter");

    expect(owner).toContain("canUsePassiveRuntime");
    expect(owner).toContain('import("./MapLibrePassiveRuntime")');
    expect(owner).toContain('import("./MapLibreAdapterRuntime")');
    expect(owner).toContain("preloadPassiveMapLibreAdapterRuntime");

    expect(passive).toContain('data-maplibre-runtime="passive"');
    expect(passive).toContain("mapCreated");
    expect(passive).toContain('from "@/core/maps/runtime/mapRuntimeState"');
    expect(passive).toContain('import("@/shared/utils/logger")');
    expect(passive).not.toContain('import { logger } from "@/shared/utils/logger"');
    expect(passive).not.toContain("MapLibreAdapter.helpers");
    expect(passive).not.toContain("useRobustGeolocation");
    expect(passive).not.toContain("useMapClustering");
    expect(passive).not.toContain("MapSearchControl");
  });
});
