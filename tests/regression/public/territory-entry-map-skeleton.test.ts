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

  it("keeps a loading surface over MapLibre until the map reports ready", () => {
    expect(runtime).toContain("RuntimeMapLoadingSurface");
    expect(runtime).toContain("!mapReady && !mapUnavailable");
    expect(runtime).toContain('aria-busy={!mapReady}');
    expect(runtime).toContain("setMapReady(true)");
  });

  it("respects reduced motion and does not encode a fake territorial boundary", () => {
    expect(wrapper).toContain("motion-reduce:animate-none");
    expect(runtime).toContain("motion-reduce:animate-none");
    expect(wrapper).not.toContain("fallback_boundary_rings");
    expect(runtime).not.toContain("fallback_boundary_rings");
  });
});
