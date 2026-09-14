import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(__dirname, "../..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("boundary fallback map defaults SSOT", () => {
  it("keeps BoundaryService fallback coordinates behind mapDefaults", () => {
    const service = read("src/core/geospatial/services/BoundaryService.ts");

    expect(service).toContain(
      'import { MAP_DEFAULT_COORDINATES } from "@/shared/config/mapDefaults";',
    );
    expect(service).toContain("MAP_DEFAULT_COORDINATES.latitude");
    expect(service).toContain("MAP_DEFAULT_COORDINATES.longitude");
    expect(service).not.toContain("[-12.975, -38.476]");
  });

  it("keeps neighborhood bounds initialization behind the same map default", () => {
    const hook = read("src/core/business/hooks/useNeighborhoodBounds.ts");

    expect(hook).toContain(
      "import { MAP_DEFAULT_COORDINATES } from '@/shared/config/mapDefaults';",
    );
    expect(hook).toContain("const DEFAULT_BOUNDS_CENTER: [number, number] = [");
    expect(hook).toContain("MAP_DEFAULT_COORDINATES.latitude");
    expect(hook).toContain("MAP_DEFAULT_COORDINATES.longitude");
    expect(hook).not.toContain("[-12.975, -38.476]");
  });

  it("keeps the passive MapLibre runtime on canonical center and zoom fallbacks", () => {
    const runtime = read("src/core/maps/components/v3/MapLibrePassiveRuntime.tsx");

    expect(runtime).toContain("MAP_DEFAULT_CENTER_LNGLAT");
    expect(runtime).toContain("MAP_DEFAULT_ZOOM");
    expect(runtime).toContain(": MAP_DEFAULT_CENTER_LNGLAT;");
    expect(runtime).toContain("initialViewport?.zoom ?? MAP_DEFAULT_ZOOM");
    expect(runtime).not.toContain("const DEFAULT_CENTER");
    expect(runtime).not.toContain("const DEFAULT_ZOOM");
    expect(runtime).not.toContain("[-51.9253, -14.235]");
  });
});
