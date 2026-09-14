import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const source = fs.readFileSync(
  path.join(ROOT, "src/app/components/territory-vivo/TerritoryEntryMap.tsx"),
  "utf8",
);

describe("territory entry map skeleton", () => {
  it("keeps the map area visibly occupied while the runtime is loading", () => {
    expect(source).toContain("EntryMapPlaceholder");
    expect(source).toContain('role="status"');
    expect(source).toContain('aria-busy="true"');
    expect(source).toContain("Carregando mapa e limite territorial oficial");
    expect(source).toContain("Complexo do Nordeste de Amaralina");
  });

  it("respects reduced motion and does not encode a fake territorial boundary", () => {
    expect(source).toContain("motion-reduce:animate-none");
    expect(source).not.toContain("fallback_boundary_rings");
  });
});
