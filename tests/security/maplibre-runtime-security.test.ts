import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

function readProjectFile(relativePath: string): string {
  return fs.readFileSync(path.resolve(ROOT, relativePath), "utf8");
}

function collectSourceFiles(directory: string): string[] {
  const absolute = path.resolve(ROOT, directory);
  return fs.readdirSync(absolute, { withFileTypes: true }).flatMap((entry) => {
    const relative = path.join(directory, entry.name);
    if (entry.isDirectory()) return collectSourceFiles(relative);
    return /\.(?:ts|tsx)$/.test(entry.name) ? [relative.replaceAll("\\", "/")] : [];
  });
}

const STATIC_MAPLIBRE_IMPORT = /import\s+(?!type\b)[\s\S]*?from\s+["']maplibre-gl["']/;
const STATIC_MAPLIBRE_CSS_IMPORT = /import\s+["']maplibre-gl\/dist\/maplibre-gl\.css["']/;

const ALLOWED_STATIC_RUNTIME_OWNERS = new Set([
  "src/core/maps/components/v3/MapLibreAdapterRuntime.tsx",
  "src/core/maps/config/maplibreWorkerRuntime.ts",
]);

const ALLOWED_STATIC_CSS_OWNER = "src/core/maps/runtime/maplibreRuntimeCss.ts";

const MIGRATED_CONSUMERS = [
  "src/shared/components/maps/MiniMap.tsx",
  "src/core/maps/components/v3/RouteLayer.tsx",
  "src/shared/components/LocationPickerSheet.tsx",
  "src/shared/components/standalone/StandaloneMap.tsx",
  "src/core/guide/tourist-points/components/TouristPointsMap.tsx",
  "src/core/community-lost-found/components/LostFoundMiniMap.tsx",
  "src/core/mobility/components/RideTrackingMap.tsx",
  "src/modules/mobility/pages/BuscandoMotoristaPage.tsx",
] as const;

describe("MapLibre production security runtime", () => {
  it("pins the patched runtime and keeps worker setup behind the canonical loader", () => {
    const packageJson = JSON.parse(readProjectFile("package.json")) as {
      dependencies?: Record<string, string>;
    };
    const packageLock = JSON.parse(readProjectFile("package-lock.json")) as {
      packages?: Record<string, { version?: string }>;
    };
    const main = readProjectFile("src/main.tsx");
    const loader = readProjectFile("src/core/maps/runtime/loadMapLibreRuntime.ts");
    const workerRuntime = readProjectFile("src/core/maps/config/maplibreWorkerRuntime.ts");

    expect(packageJson.dependencies?.["maplibre-gl"]).toBe("6.4.1");
    expect(packageLock.packages?.["node_modules/maplibre-gl"]?.version).toBe("6.4.1");

    expect(main).not.toContain('from "maplibre-gl"');
    expect(main).not.toContain("setWorkerUrl");
    expect(loader).toContain('import("maplibre-gl")');
    expect(loader).toContain('import("../config/maplibreWorkerRuntime")');
    expect(loader).toContain("ensureMapLibreWorkerConfigured(runtime.setWorkerUrl)");
    expect(loader).toContain("prewarmMapLibreWorkers");
    expect(loader).toContain("runtime.prewarm()");
    expect(workerRuntime).toContain("ensureMapLibreWorkerConfigured");
    expect(workerRuntime).toContain("setWorkerUrl(maplibreWorkerUrl)");
    expect(workerRuntime).not.toContain('from "maplibre-gl"');
  });

  it("makes the public adapter path lazy while keeping the heavy implementation internal", () => {
    const owner = readProjectFile("src/core/maps/components/v3/MapLibreAdapter.tsx");
    const runtime = readProjectFile("src/core/maps/components/v3/MapLibreAdapterRuntime.tsx");
    const compatibility = readProjectFile("src/core/maps/components/v3/LazyMapLibreAdapter.tsx");

    expect(owner).toContain("loadMapLibreRuntime");
    expect(owner).toContain('import("./MapLibreAdapterRuntime")');
    expect(owner).not.toContain('import * as maplibregl from "maplibre-gl"');
    expect(runtime).toContain('import * as maplibregl from "maplibre-gl"');
    expect(runtime).toContain("setMissingStyleImageResolver");
    expect(compatibility).toContain('from "./MapLibreAdapter"');
  });

  it("keeps migrated consumers behind the canonical runtime loader", () => {
    for (const sourcePath of MIGRATED_CONSUMERS) {
      const source = readProjectFile(sourcePath);
      expect(source).not.toMatch(STATIC_MAPLIBRE_IMPORT);
      expect(source).not.toMatch(STATIC_MAPLIBRE_CSS_IMPORT);
      expect(source).toContain("loadMapLibreRuntime");
    }
  });

  it("forbids new static MapLibre owners outside the controlled core", () => {
    const violations = collectSourceFiles("src").filter((sourcePath) => {
      const source = readProjectFile(sourcePath);
      if (STATIC_MAPLIBRE_IMPORT.test(source)) {
        return !ALLOWED_STATIC_RUNTIME_OWNERS.has(sourcePath);
      }
      if (STATIC_MAPLIBRE_CSS_IMPORT.test(source)) {
        return sourcePath !== ALLOWED_STATIC_CSS_OWNER && !ALLOWED_STATIC_RUNTIME_OWNERS.has(sourcePath);
      }
      return false;
    });

    expect(violations).toEqual([]);
  });
});