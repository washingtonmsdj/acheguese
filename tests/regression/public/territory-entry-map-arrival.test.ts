import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const read = (p: string) => fs.readFileSync(path.join(ROOT, p), "utf8");
const wrapper = read("src/app/components/territory-vivo/TerritoryEntryMap.tsx");
const runtime = read("src/app/components/territory-vivo/TerritoryEntryMapRuntime.tsx");
const arrival = read("src/app/components/territory-vivo/TerritoryEntryMapArrival.tsx");

describe("territory entry map arrival", () => {
  it("starts map work before territorial resolution finishes", () => {
    expect(wrapper).toContain("loadTerritoryEntryMapRuntime");
    expect(wrapper).toContain('rootMargin: "720px 0px"');
    expect(wrapper).not.toContain("if (isLoading || shouldMountRuntime) return");
    expect(wrapper).toContain("isLoading={isLoading}");
  });

  it("reveals the base map as soon as MapLibre is ready", () => {
    expect(runtime).toContain('mapReady ? "opacity-100" : "opacity-0"');
    expect(runtime).not.toContain("const mapPresented = mapReady && !isBoundaryLoading");
    expect(runtime).not.toContain("setMapReady(false)");
    expect(runtime).toContain("MAP_TIMEOUT_MS = 6000");
  });

  it("loads the official boundary progressively without fake geometry", () => {
    expect(runtime).toContain("hasCompleteGroupBoundary ? polygons : []");
    expect(runtime).toContain("boundaryPending");
    expect(runtime).toContain("BOUNDARY_TIMEOUT_MS = 8000");
    expect(runtime).toContain("Mapa pronto. Carregando limite oficial");
    expect(runtime).toContain("Não exibimos contorno aproximado ou incompleto do Complexo.");
    expect(runtime).not.toContain("fallback_boundary_rings");
  });

  it("keeps the premium arrival and crossfade", () => {
    expect(arrival).toContain("data-entry-arrival-loading");
    expect(arrival).toContain("leaving?: boolean");
    expect(runtime).toContain("ARRIVAL_CROSSFADE_MS = 360");
    expect(runtime).toContain("setArrivalLeaving(true)");
    expect(wrapper).toContain("min-h-[12rem]");
    expect(runtime).toContain("lg:min-h-[24rem]");
  });
});
