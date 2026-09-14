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

describe("territory entry map skeleton", () => {
  it("keeps the map area visibly occupied while the runtime is loading", () => {
    expect(wrapper).toContain("EntryMapPlaceholder");
    expect(wrapper).toContain('role="status"');
    expect(wrapper).toContain('aria-busy="true"');
    expect(wrapper).toContain("Carregando mapa e limite territorial oficial");
    expect(wrapper).toContain("Complexo do Nordeste de Amaralina");
  });

  it("keeps the loading surface until both MapLibre and boundary loading settle", () => {
    expect(runtime).toContain("RuntimeMapLoadingSurface");
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

  it("respects reduced motion and does not encode a fake territorial boundary", () => {
    expect(wrapper).toContain("motion-reduce:animate-none");
    expect(runtime).toContain("motion-reduce:animate-none");
    expect(wrapper).not.toContain("fallback_boundary_rings");
    expect(runtime).not.toContain("fallback_boundary_rings");
  });
});
