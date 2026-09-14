import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const wrapper = fs.readFileSync(
  path.join(ROOT, "src/app/components/territory-vivo/TerritoryEntryMap.tsx"),
  "utf8",
);
const runtime = fs.readFileSync(
  path.join(ROOT, "src/app/components/territory-vivo/TerritoryEntryMapRuntime.tsx"),
  "utf8",
);
const skeleton = fs.readFileSync(
  path.join(ROOT, "src/app/components/territory-vivo/TerritoryEntryMapSkeleton.tsx"),
  "utf8",
);

describe("territory entry map skeleton", () => {
  it("keeps the map area visibly occupied while the runtime is loading", () => {
    expect(wrapper).toContain("EntryMapPlaceholder");
    expect(wrapper).toContain('role="status"');
    expect(wrapper).toContain('aria-busy="true"');
    expect(wrapper).toContain("Carregando mapa e limite territorial oficial");
    expect(wrapper).toContain("Complexo do Nordeste de Amaralina");
    expect(wrapper).toContain("<TerritoryEntryMapSkeleton");
  });

  it("uses one shared full-area skeleton before and during MapLibre startup", () => {
    expect(wrapper).toContain("h-full min-h-[12rem] w-full");
    expect(wrapper).toContain("md:min-h-[18rem]");
    expect(wrapper).toContain("lg:min-h-[24rem]");
    expect(runtime).toContain("h-full min-h-[12rem] w-full");
    expect(runtime).toContain("md:min-h-[18rem]");
    expect(runtime).toContain("lg:min-h-[24rem]");
    expect(runtime).toContain("<TerritoryEntryMapSkeleton");
    expect(skeleton).toContain("absolute inset-0 z-20");
    expect(skeleton).toContain("data-entry-map-skeleton");
  });

  it("renders unmistakable map-like loading structure instead of only a status strip", () => {
    expect(skeleton).toContain("backgroundImage");
    expect(skeleton).toContain("backgroundSize");
    expect(skeleton).toContain("BLOCK_STYLE");
    expect(skeleton).toContain("ROAD_STYLE");
    expect(skeleton).toContain("territory-ink) / 0.08");
    expect(skeleton).toContain("territory-ink) / 0.14");
    expect(skeleton).toContain("top-[31%]");
    expect(skeleton).toContain("top-[55%]");
    expect(skeleton).toContain("motion-safe:animate-pulse");
  });

  it("adapts the loading composition for both mobile and desktop map areas", () => {
    expect(skeleton).toContain("inset-x-3 bottom-3");
    expect(skeleton).toContain("lg:inset-x-auto");
    expect(skeleton).toContain("lg:left-6");
    expect(skeleton).toContain("lg:block");
    expect(skeleton).toContain("xl:block");
    expect(skeleton).toContain("lg:rounded-3xl");
  });

  it("keeps the loading surface until both MapLibre and boundary loading settle", () => {
    expect(runtime).toContain("const mapPresented = mapReady && !isBoundaryLoading");
    expect(runtime).toContain("!mapPresented && !mapUnavailable");
    expect(runtime).toContain('aria-busy={!mapPresented}');
    expect(runtime).toContain('mapPresented ? "opacity-100" : "opacity-0"');
    expect(runtime).toContain("setMapReady(true)");
  });

  it("keeps a bounded failure path instead of an endless skeleton", () => {
    expect(runtime).toContain("if (isLoading || mapPresented) return");
    expect(runtime).toContain("setMapUnavailable(true)");
    expect(runtime).toContain("8000");
  });

  it("respects reduced motion and never encodes a fake territorial boundary", () => {
    expect(skeleton).toContain("motion-reduce:animate-none");
    expect(skeleton).not.toContain("fallback_boundary_rings");
    expect(wrapper).not.toContain("fallback_boundary_rings");
    expect(runtime).not.toContain("fallback_boundary_rings");
  });
});
