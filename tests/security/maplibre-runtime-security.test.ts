import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(relativePath: string): string {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), "utf8");
}

const MAPLIBRE_RUNTIME_FILES = [
  "src/shared/components/maps/MiniMap.tsx",
  "src/core/maps/components/v3/RouteLayer.tsx",
  "src/shared/components/LocationPickerSheet.tsx",
  "src/core/mobility/components/RideTrackingMap.tsx",
  "src/shared/components/standalone/StandaloneMap.tsx",
  "src/modules/mobility/pages/BuscandoMotoristaPage.tsx",
  "src/modules/mobility/components/map/LiveTrackingMap.tsx",
  "src/core/guide/tourist-points/components/TouristPointsMap.tsx",
  "src/core/community-lost-found/components/LostFoundMiniMap.tsx",
  "src/core/maps/components/v3/MapLibreAdapter.tsx",
] as const;

describe("MapLibre production security runtime", () => {
  it("pins the first patched v6 runtime and configures the Vite worker explicitly", () => {
    const packageJson = JSON.parse(readProjectFile("package.json")) as {
      dependencies?: Record<string, string>;
    };
    const packageLock = JSON.parse(readProjectFile("package-lock.json")) as {
      packages?: Record<string, { version?: string }>;
    };
    const main = readProjectFile("src/main.tsx");

    expect(packageJson.dependencies?.["maplibre-gl"]).toBe("6.4.1");
    expect(packageLock.packages?.["node_modules/maplibre-gl"]?.version).toBe("6.4.1");

    expect(main).toContain(
      'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url',
    );
    expect(main).toContain("setWorkerUrl(maplibreWorkerUrl)");

    for (const sourcePath of MAPLIBRE_RUNTIME_FILES) {
      const source = readProjectFile(sourcePath);
      expect(source).toContain('import * as maplibregl from "maplibre-gl";');
      expect(source).not.toMatch(
        /import\s+maplibregl\s+from\s+["']maplibre-gl["']/,
      );
    }

    for (const sourcePath of [
      "src/shared/components/maps/MiniMap.tsx",
      "src/core/maps/components/v3/MapLibreAdapter.tsx",
    ]) {
      const source = readProjectFile(sourcePath);
      expect(source).toContain("setMissingStyleImageResolver");
      expect(source).not.toMatch(
        /\.on\(\s*["']styleimagemissing["'][\s\S]{0,240}addImage\(/,
      );
    }
  });
});
