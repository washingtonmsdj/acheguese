import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const read = (p: string) => fs.readFileSync(path.join(ROOT, p), "utf8");
const wrapper = read("src/app/components/territory-vivo/TerritoryEntryMap.tsx");
const runtime = read("src/app/components/territory-vivo/TerritoryEntryMapRuntime.tsx");
const arrival = read("src/app/components/territory-vivo/TerritoryEntryMapArrival.tsx");

describe("territory entry map arrival", () => {
  it("requests map runtime in the same render that shows the skeleton fallback", () => {
    expect(wrapper).toContain("loadTerritoryEntryMapRuntime");
    expect(wrapper).toContain("LazyTerritoryEntryMapRuntime");
    expect(wrapper).toContain("<Suspense");
    expect(wrapper).not.toContain("shouldMountRuntime");
    expect(wrapper).not.toContain("setShouldMountRuntime");
    expect(wrapper).not.toContain("IntersectionObserver");
    expect(wrapper).not.toContain("rootMargin");
    expect(wrapper).not.toContain("scheduleBrowserIdleWork");
    expect(wrapper).toContain("isLoading={isLoading}");
  });

  it("preloads engine and official boundary in parallel", () => {
    expect(wrapper).toContain("Promise.all([");
    expect(wrapper).toContain("module.preloadTerritoryEntryMapEngine()");
    expect(wrapper).toContain("module.preloadTerritoryEntryBoundary(preloadResolved)");
    expect(wrapper).toContain('link.setAttribute("fetchpriority", "high")');
    expect(wrapper).not.toContain("await module.preloadTerritoryEntryMapEngine()");
  });

  it("never hides the canvas while MapLibre is progressively rendering", () => {
    expect(runtime).toContain('className="pointer-events-none h-full min-h-[12rem] w-full');
    expect(runtime).not.toContain('mapReady ? "opacity-100" : "opacity-0"');
    expect(runtime).not.toContain("duration-500");
    expect(runtime).not.toContain("const mapPresented = mapReady && !isBoundaryLoading");
    expect(runtime).not.toContain("setMapReady(false)");
    expect(runtime).toContain("MAP_TIMEOUT_MS = 6000");
    expect(runtime).toContain("ARRIVAL_CROSSFADE_MS = 160");
  });

  it("loads the official boundary progressively without fake geometry", () => {
    expect(runtime).toContain("hasCompleteGroupBoundary ? polygons : []");
    expect(runtime).toContain("boundaryPending");
    expect(runtime).toContain("BOUNDARY_TIMEOUT_MS = 8000");
    expect(runtime).toContain("Mapa pronto. Carregando limite oficial");
    expect(runtime).toContain("Não exibimos contorno aproximado ou incompleto do Complexo.");
    expect(runtime).not.toContain("fallback_boundary_rings");
  });

  it("uses an Instagram-like page-native skeleton instead of a conceptual loader", () => {
    expect(arrival).toContain("data-entry-skeleton");
    expect(arrival).toContain("data-entry-skeleton-grid");
    expect(arrival).toContain("data-entry-skeleton-card");
    expect(arrival).toContain("data-entry-skeleton-shimmer");
    expect(arrival).toContain("Preparando comunidade");
    expect(arrival).toContain("Abrindo mapa");
    expect(arrival).toContain("duration-150");
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
