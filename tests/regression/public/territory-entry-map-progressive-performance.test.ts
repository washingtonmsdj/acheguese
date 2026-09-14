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
    expect(hook).toContain("options: { enabled?: boolean } = {}");
  });

  it("never hides the passive map canvas while territory data arrives", () => {
    const runtime = read("src/app/components/territory-vivo/TerritoryEntryMapRuntime.tsx");
    expect(runtime).not.toContain("setMapReady(false)");
    expect(runtime).not.toContain('mapReady ? "opacity-100" : "opacity-0"');
    expect(runtime).not.toContain("duration-500");
    expect(runtime).toContain('className="pointer-events-none h-full min-h-[12rem] w-full');
  });

  it("does not replay the arrival skeleton after a terminal timeout recovers late", () => {
    const runtime = read("src/app/components/territory-vivo/TerritoryEntryMapRuntime.tsx");

    expect(runtime).toContain("const mapTimedOutRef = useRef(false)");
    expect(runtime).toContain("mapTimedOutRef.current = true");
    expect(runtime).toContain("if (mapTimedOutRef.current) {");
    expect(runtime).toContain("setShowArrival(false)");
    expect(runtime).toContain("setArrivalLeaving(false)");
    expect(runtime).toContain("const ARRIVAL_CROSSFADE_MS = 160");
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

  it("gives the basemap an exclusive first-paint window before boundary network and style reads", () => {
    const html = read("index.html");
    const wrapper = read("src/app/components/territory-vivo/TerritoryEntryMap.tsx");
    const runtime = read("src/app/components/territory-vivo/TerritoryEntryMapRuntime.tsx");

    expect(html).not.toContain("services6.arcgis.com");
    expect(wrapper).not.toContain("preconnectOfficialBoundarySources");
    expect(wrapper).not.toContain("preloadEntryOfficialBoundary");
    expect(wrapper).not.toContain("loadOfficialFeatureServerBoundaries");
    expect(wrapper).not.toContain("source_url");

    expect(runtime).toContain("const [boundaryStarted, setBoundaryStarted] = useState(false)");
    expect(runtime).toContain("useTerritoryPolygon(resolved, {");
    expect(runtime).toContain("enabled: boundaryStarted");
    expect(runtime).toContain("window.requestAnimationFrame(() => setBoundaryStarted(true))");
    expect(runtime).toContain("if (!boundaryStarted || typeof document === \"undefined\")");
    expect(runtime).toContain("getComputedStyle(document.documentElement)");
    expect(runtime).toContain("}, [boundaryStarted]);");
    expect(runtime).toContain("markPublicRootMapReady();");
    expect(runtime).toContain("!boundaryStarted || isLoading || isBoundaryLoading");
  });

  it("preloads style and TileJSON before React while runtime, engine and workers start together", () => {
    const main = read("src/main.tsx");
    const defaults = read("src/shared/config/mapDefaults.ts");
    const wrapper = read("src/app/components/territory-vivo/TerritoryEntryMap.tsx");
    const runtime = read("src/app/components/territory-vivo/TerritoryEntryMapRuntime.tsx");
    const owner = read("src/core/maps/components/v3/MapLibreAdapter.tsx");
    const loader = read("src/core/maps/runtime/loadMapLibreRuntime.ts");
    const passive = read("src/core/maps/components/v3/MapLibrePassiveRuntime.tsx");

    expect(defaults).toContain('styleUrl: "https://tiles.openfreemap.org/styles/positron"');
    expect(defaults).toContain('OPENFREEMAP_TILEJSON_URL = "https://tiles.openfreemap.org/planet"');
    expect(main).toContain("DEFAULT_TILE_STYLE");
    expect(main).toContain("OPENFREEMAP_TILEJSON_URL");
    expect(main).toContain('mapStylePreload.rel = "preload"');
    expect(main).toContain('mapStylePreload.as = "fetch"');
    expect(main).toContain('mapStylePreload.setAttribute("fetchpriority", "high")');
    expect(main).toContain('tileJsonPreload.rel = "preload"');
    expect(main).toContain('tileJsonPreload.as = "fetch"');
    expect(main).toContain('tileJsonPreload.setAttribute("fetchpriority", "high")');
    expect(main.indexOf("data-entry-map-style-preload")).toBeLessThan(
      main.indexOf("root.render(<App />)"),
    );
    expect(main.indexOf("data-entry-map-tilejson-preload")).toBeLessThan(
      main.indexOf("root.render(<App />)"),
    );
    expect(wrapper).not.toContain("preloadEntryMapStyle");
    expect(wrapper).toContain("const loadTerritoryEntryMapRuntime = async () =>");
    expect(wrapper).toContain("const [runtimeModule] = await Promise.all([");
    expect(wrapper).toContain('import("./TerritoryEntryMapRuntime")');
    expect(wrapper).toContain('import("@/core/maps/components/v3/MapLibreAdapter")');
    expect(wrapper).toContain("preloadPassiveMapLibreAdapterRuntime");
    expect(wrapper).not.toContain("preloadEntryMapEngine");
    expect(wrapper).not.toContain("void loadTerritoryEntryMapRuntime()");

    expect(runtime).not.toContain("preloadPassiveMapLibreAdapterRuntime");
    expect(runtime).not.toContain("preloadTerritoryPolygons");
    expect(runtime).toContain('from "@/core/maps/components/v3/MapLibreAdapter"');
    expect(runtime).not.toContain("LazyMapLibreAdapter");

    expect(owner).toContain("canUsePassiveRuntime");
    expect(owner).toContain('import("./MapLibrePassiveRuntime")');
    expect(owner).toContain('import("./MapLibreAdapterRuntime")');
    expect(owner).toContain("preloadPassiveMapLibreAdapterRuntime");
    expect(owner).toContain("prewarmMapLibreWorkers");
    expect(loader).toContain("let workersPrewarmed = false");
    expect(loader).toContain("ensureMapLibreWorkerConfigured(runtime.setWorkerUrl)");
    expect(loader).toContain("runtime.prewarm()");
    expect(loader).toContain("try {");
    expect(loader).toContain("catch {");
    expect(loader).toContain("Best-effort only");
    expect(loader.indexOf("ensureMapLibreWorkerConfigured(runtime.setWorkerUrl)")).toBeLessThan(
      loader.indexOf("runtime.prewarm()"),
    );

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