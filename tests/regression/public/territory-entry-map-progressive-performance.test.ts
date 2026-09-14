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

  it("never hides the passive map canvas while territory data arrives", () => {
    const runtime = read("src/app/components/territory-vivo/TerritoryEntryMapRuntime.tsx");
    expect(runtime).not.toContain("setMapReady(false)");
    expect(runtime).not.toContain('mapReady ? "opacity-100" : "opacity-0"');
    expect(runtime).not.toContain("duration-500");
    expect(runtime).toContain('className="pointer-events-none h-full min-h-[12rem] w-full');
  });

  it("starts on official territory centers instead of loading city-wide tiles first", () => {
    const runtime = read("src/app/components/territory-vivo/TerritoryEntryMapRuntime.tsx");
    expect(runtime).toContain("readLocationCenter");
    expect(runtime).toContain("resolveInitialViewport");
    expect(runtime).toContain("resolved.group.members");
    expect(runtime).toContain("center_latitude");
    expect(runtime).toContain("center_longitude");
    expect(runtime).toContain("zoom: 13.1");
    expect(runtime).toContain("initialViewport={initialViewport}");
  });

  it("preconnects official boundary authorities from SSOT metadata", () => {
    const wrapper = read("src/app/components/territory-vivo/TerritoryEntryMap.tsx");
    expect(wrapper).toContain("preconnectOfficialBoundarySources");
    expect(wrapper).toContain("location.metadata?.source_url");
    expect(wrapper).toContain('link[rel="preconnect"]');
    expect(wrapper).toContain('preconnect.rel = "preconnect"');
    expect(wrapper).toContain('dnsPrefetch.rel = "dns-prefetch"');
    expect(wrapper).toContain("preconnectOfficialBoundarySources(preloadResolved)");
    expect(wrapper).not.toContain("services6.arcgis.com");
  });

  it("preloads style, engine and official boundary concurrently", () => {
    const wrapper = read("src/app/components/territory-vivo/TerritoryEntryMap.tsx");
    const runtime = read("src/app/components/territory-vivo/TerritoryEntryMapRuntime.tsx");
    const owner = read("src/core/maps/components/v3/MapLibreAdapter.tsx");
    const passive = read("src/core/maps/components/v3/MapLibrePassiveRuntime.tsx");

    expect(wrapper).toContain("preloadEntryMapStyle");
    expect(wrapper).toContain('link.rel = "preload"');
    expect(wrapper).toContain('link.as = "fetch"');
    expect(wrapper).toContain('link.setAttribute("fetchpriority", "high")');
    expect(wrapper).toContain("Promise.all([");
    expect(wrapper).toContain("module.preloadTerritoryEntryMapEngine()");
    expect(wrapper).toContain("module.preloadTerritoryEntryBoundary(preloadResolved)");
    expect(wrapper).not.toContain("await module.preloadTerritoryEntryMapEngine()");

    expect(runtime).toContain("preloadPassiveMapLibreAdapterRuntime");
    expect(runtime).toContain("preloadTerritoryPolygons");
    expect(runtime).toContain('from "@/core/maps/components/v3/MapLibreAdapter"');
    expect(runtime).not.toContain("LazyMapLibreAdapter");

    expect(owner).toContain("canUsePassiveRuntime");
    expect(owner).toContain('import("./MapLibrePassiveRuntime")');
    expect(owner).toContain('import("./MapLibreAdapterRuntime")');
    expect(owner).toContain("preloadPassiveMapLibreAdapterRuntime");

    expect(passive).toContain('data-maplibre-runtime="passive"');
    expect(passive).toContain('from "@/core/maps/runtime/mapRuntimeState"');
    expect(passive).toContain('import("@/shared/utils/logger")');
    expect(passive).not.toContain('import { logger } from "@/shared/utils/logger"');
    expect(passive).not.toContain("MapLibreAdapter.helpers");
    expect(passive).not.toContain("useRobustGeolocation");
    expect(passive).not.toContain("useMapClustering");
  });

  it("uses a conservative render and camera budget for passive maps", () => {
    const passive = read("src/core/maps/components/v3/MapLibrePassiveRuntime.tsx");
    expect(passive).toContain("PASSIVE_MAX_PIXEL_RATIO = 2");
    expect(passive).toContain("PASSIVE_CAMERA_DURATION_MS = 180");
    expect(passive).toContain("fadeDuration: 0");
    expect(passive).toContain("pixelRatio: passivePixelRatio");
    expect(passive).toContain("renderWorldCopies: false");
    expect(passive).toContain("maxTileCacheZoomLevels: 1");
    expect(passive).not.toContain("duration: 800");
  });
});
