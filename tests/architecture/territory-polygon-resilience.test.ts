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

  it("aborts a stalled request to the official FeatureServer before the shared hook timeout", () => {
    const source = read(
      "src/core/geospatial/data/officialFeatureServerBoundary.ts",
    );

    expect(source).toContain("const OFFICIAL_BOUNDARY_FETCH_TIMEOUT_MS = 7_000;");
    expect(source).toContain("const controller = new AbortController();");
    expect(source).toContain("() => controller.abort()");
    expect(source).toContain("signal: controller.signal");
    expect(source).toContain("clearTimeout(timeoutId)");
    expect(source).toContain("not negative-cached");
  });

  it("keeps one owner for FeatureServer parsing, cache and network access", () => {
    const service = read("src/core/geospatial/services/BoundaryService.ts");
    const source = read(
      "src/core/geospatial/data/officialFeatureServerBoundary.ts",
    );

    expect(service).toContain(
      'import { loadOfficialFeatureServerBoundary } from "../data/officialFeatureServerBoundary";',
    );
    expect(service).toContain("await loadOfficialFeatureServerBoundary(location)");
    expect(service).not.toContain("metadataSourceBoundaryCache");
    expect(service).not.toContain("getOfficialFeatureServerSource(");
    expect(service).not.toContain("await fetch(");
    expect(service).not.toContain("FeatureServer responded with");

    expect(source).toContain("const boundaryCache = new Map");
    expect(source).toContain("const pendingBatches = new Map");
    expect(source).toContain("function getOfficialSource(location: Location)");
    expect(source).toContain("const response = await fetch(url.toString(), {");
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
