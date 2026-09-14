import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(__dirname, "../..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("territory polygon loading resilience", () => {
  it("bounds the shared polygon promise instead of leaving consumers loading forever", () => {
    const hook = read("src/core/maps/hooks/useTerritoryPolygon.ts");

    expect(hook).toContain("const POLYGON_LOAD_TIMEOUT_MS = 12_000;");
    expect(hook).toContain("function withPolygonLoadTimeout<T>(promise: Promise<T>)");
    expect(hook).toContain('new Error("territory_polygon_timeout")');
    expect(hook).toContain(
      "withPolygonLoadTimeout(fetchTerritoryPolygons(resolved))",
    );
    expect(hook).toContain("polygonPromises.delete(territoryKey)");
  });

  it("keeps the public root slow-boundary state non-blocking while the shared load is bounded", () => {
    const runtime = read(
      "src/app/components/territory-vivo/TerritoryEntryMapRuntime.tsx",
    );

    expect(runtime).toContain("const BOUNDARY_TIMEOUT_MS = 8000;");
    expect(runtime).toContain("!boundarySlow &&");
    expect(runtime).toContain("Mapa pronto. Limite oficial ainda carregando.");
    expect(runtime).toContain("segue sendo buscado em segundo plano, sem usar aproximação");
  });
});
