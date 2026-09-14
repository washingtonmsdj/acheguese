import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const read = (p: string) => fs.readFileSync(path.join(ROOT, p), "utf8");
const main = read("src/main.tsx");
const wrapper = read("src/app/components/territory-vivo/TerritoryEntryMap.tsx");
const runtime = read("src/app/components/territory-vivo/TerritoryEntryMapRuntime.tsx");
const arrival = read("src/app/components/territory-vivo/TerritoryEntryMapArrival.tsx");
const readiness = read("src/shared/utils/publicRootReadiness.ts");
const tailwind = read("tailwind.config.ts");

describe("territory entry map arrival", () => {
  it("requests map runtime and engine in the same render that shows the skeleton fallback", () => {
    expect(wrapper).toContain("loadTerritoryEntryMapRuntime");
    expect(wrapper).toContain("Promise.all([");
    expect(wrapper).toContain('import("./TerritoryEntryMapRuntime")');
    expect(wrapper).toContain('import("@/core/maps/components/v3/MapLibreAdapter")');
    expect(wrapper).toContain("preloadPassiveMapLibreAdapterRuntime");
    expect(wrapper).toContain("LazyTerritoryEntryMapRuntime");
    expect(wrapper).toContain("<Suspense");
    expect(wrapper).not.toContain("shouldMountRuntime");
    expect(wrapper).not.toContain("setShouldMountRuntime");
    expect(wrapper).not.toContain("IntersectionObserver");
    expect(wrapper).not.toContain("rootMargin");
    expect(wrapper).not.toContain("scheduleBrowserIdleWork");
    expect(wrapper).toContain("isLoading={isLoading}");
  });

  it("discovers style before render and starts official boundary only after map readiness", () => {
    expect(main).toContain("DEFAULT_TILE_STYLE");
    expect(main).toContain('mapStylePreload.setAttribute("fetchpriority", "high")');
    expect(main.indexOf("data-entry-map-style-preload")).toBeLessThan(
      main.indexOf("root.render(<App />)"),
    );
    expect(wrapper).not.toContain("preloadEntryMapStyle");
    expect(wrapper).not.toContain("preloadEntryOfficialBoundary");
    expect(wrapper).not.toContain("loadOfficialFeatureServerBoundaries");
    expect(wrapper).not.toContain("preconnectOfficialBoundarySources");
    expect(runtime).toContain("enabled: boundaryStarted");
    expect(runtime).toContain("window.requestAnimationFrame(() => setBoundaryStarted(true))");
    expect(runtime).toContain("markPublicRootMapReady();");
    expect(runtime).not.toContain("preloadTerritoryEntryMapEngine");
    expect(runtime).not.toContain("preloadTerritoryEntryBoundary");
  });

  it("never hides the canvas while MapLibre is progressively rendering", () => {
    expect(runtime).toContain('className="pointer-events-none h-full min-h-[12rem] w-full');
    expect(runtime).not.toContain('mapReady ? "opacity-100" : "opacity-0"');
    expect(runtime).not.toContain("duration-500");
    expect(runtime).not.toContain("const mapPresented = mapReady && !isBoundaryLoading");
    expect(runtime).not.toContain("setMapReady(false)");
    expect(runtime).toContain("PUBLIC_ROOT_MAP_TERMINAL_TIMEOUT_MS");
    expect(readiness).toContain("PUBLIC_ROOT_MAP_TERMINAL_TIMEOUT_MS = 6000");
    expect(runtime).not.toContain("const MAP_TIMEOUT_MS");
    expect(runtime).toContain("ARRIVAL_CROSSFADE_MS = 160");
  });

  it("loads the official boundary progressively without fake geometry", () => {
    expect(runtime).toContain("hasCompleteGroupBoundary ? polygons : []");
    expect(runtime).toContain("boundaryPending");
    expect(runtime).toContain("BOUNDARY_TIMEOUT_MS = 8000");
    expect(runtime).toContain("Mapa pronto. Carregando limite oficial");
    expect(runtime).toContain("contorno aproximado ou incompleto de {territoryLabel}");
    expect(runtime).not.toContain("fallback_boundary_rings");
  });

  it("keeps the skeleton limited to pre-map states and uses compositor-only shimmer", () => {
    expect(arrival).toContain(
      'export type TerritoryEntryArrivalStage = "community" | "map";',
    );
    expect(arrival).not.toContain('boundary: "Finalizando limite oficial"');
    expect(wrapper).toContain('stage={isLoading ? "community" : "map"}');
    expect(runtime).toContain('stage={isLoading ? "community" : "map"}');

    expect(arrival).toContain("data-entry-skeleton");
    expect(arrival).toContain("data-entry-skeleton-grid");
    expect(arrival).toContain("data-entry-skeleton-card");
    expect(arrival).toContain("data-entry-skeleton-shimmer");
    expect(arrival).toContain("Preparando comunidade");
    expect(arrival).toContain("Abrindo mapa");
    expect(arrival).toContain("duration-150");
    expect(arrival).toContain("motion-safe:animate-entry-shimmer");
    expect(arrival).toContain("will-change-transform");
    expect(arrival).toContain("w-[32%]");
    expect(arrival).not.toContain("animate-shimmer");
    expect(arrival).not.toContain("bg-[length:55rem_100%]");
    expect(tailwind).toContain('"entry-shimmer"');
    expect(tailwind).toContain('transform: "translate3d(-150%, 0, 0)"');
    expect(tailwind).toContain('transform: "translate3d(430%, 0, 0)"');
    expect(tailwind).toContain('"entry-shimmer": "entry-shimmer 1.8s ease-in-out infinite"');
    expect(arrival).not.toContain("lucide-react");
    expect(arrival).not.toContain("setTimeout");
    expect(arrival).not.toContain("Globe");
    expect(arrival).not.toContain("Sparkles");
    expect(arrival).not.toContain("Preparando sua chegada");
    expect(arrival).not.toContain("Conectando você ao território");
    expect(runtime).not.toContain("lucide-react");
    expect(wrapper).toContain("min-h-[12rem]");
    expect(runtime).toContain("lg:min-h-[24rem]");
  });
});
