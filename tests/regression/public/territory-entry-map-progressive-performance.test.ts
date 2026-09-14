import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const read = (p: string) => fs.readFileSync(path.join(ROOT, p), "utf8");

describe("territory entry progressive map performance", () => {
  it("keeps boundary infrastructure out of the map render path", () => {
    const hook = read("src/core/maps/hooks/useTerritoryPolygon.ts");
    expect(hook).not.toContain('import { boundaryService } from "@/core/geospatial"');
    expect(hook).toContain('import(\n          "@/core/geospatial/services/BoundaryService"');
  });

  it("does not reset MapLibre readiness when territory data arrives", () => {
    const runtime = read("src/app/components/territory-vivo/TerritoryEntryMapRuntime.tsx");
    expect(runtime).not.toContain("setMapReady(false)");
    expect(runtime).toContain('mapReady ? "opacity-100" : "opacity-0"');
  });

  it("preloads the entry runtime, MapLibre engine and OpenFreeMap style", () => {
    const wrapper = read("src/app/components/territory-vivo/TerritoryEntryMap.tsx");
    const runtime = read("src/app/components/territory-vivo/TerritoryEntryMapRuntime.tsx");
    const lazyAdapter = read("src/core/maps/components/v3/LazyMapLibreAdapter.tsx");

    expect(wrapper).toContain("loadTerritoryEntryMapRuntime");
    expect(wrapper).toContain("preloadEntryMapStyle");
    expect(wrapper).toContain('link.rel = "preload"');
    expect(wrapper).toContain('link.as = "fetch"');
    expect(wrapper).toContain("preloadTerritoryEntryMapEngine");
    expect(runtime).toContain("preloadMapLibreAdapterRuntime");
    expect(lazyAdapter).toContain("preloadMapLibreAdapterRuntime");
  });
});
