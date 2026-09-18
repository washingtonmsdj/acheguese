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

const STATIC_MAPLIBRE_IMPORT = /\bimport\s+(?!type\b)[^;]*?\bfrom\s+["']maplibre-gl["']/;
const STATIC_MAPLIBRE_CSS_IMPORT = /import\s+["']maplibre-gl\/dist\/maplibre-gl\.css["']/;

const ALLOWED_STATIC_RUNTIME_OWNER =
  "src/core/maps/components/v3/MapLibreAdapterRuntime.tsx";
const ALLOWED_STATIC_CSS_OWNER = "src/core/maps/runtime/maplibreRuntimeCss.ts";
const LEGACY_ADAPTER_BRIDGE = "src/core/maps/components/v3/LazyMapLibreAdapter.tsx";

const MIGRATED_CONSUMERS = [
  "src/core/maps/components/MiniMap.tsx",
  "src/core/maps/components/LocationPickerSheet.tsx",
  "src/core/maps/components/StandaloneMap.tsx",
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
    const cssOwner = readProjectFile(ALLOWED_STATIC_CSS_OWNER);

    expect(packageJson.dependencies?.["maplibre-gl"]).toBe("6.4.1");
    expect(packageLock.packages?.["node_modules/maplibre-gl"]?.version).toBe("6.4.1");

    expect(main).not.toContain('from "maplibre-gl"');
    expect(main).not.toContain("setWorkerUrl");
    expect(loader).toContain('import("maplibre-gl")');
    expect(loader).toContain('import("../config/maplibreWorkerRuntime")');
    expect(loader).toContain('import("./maplibreRuntimeCss")');
    expect(loader).toContain("ensureMapLibreWorkerConfigured(runtime.setWorkerUrl)");
    expect(loader).toContain("prewarmMapLibreWorkers");
    expect(loader).toContain("runtime.prewarm()");
    expect(workerRuntime).toContain("ensureMapLibreWorkerConfigured");
    expect(workerRuntime).toContain("setWorkerUrl(maplibreWorkerUrl)");
    expect(workerRuntime).not.toContain('from "maplibre-gl"');
    expect(cssOwner).toContain('import "maplibre-gl/dist/maplibre-gl.css"');
  });

  it("keeps one public adapter owner and removes the legacy lazy bridge", () => {
    const owner = readProjectFile("src/core/maps/components/v3/MapLibreAdapter.tsx");
    const runtime = readProjectFile(ALLOWED_STATIC_RUNTIME_OWNER);
    const barrel = readProjectFile("src/core/maps/components/v3/index.ts");

    expect(owner).toContain("loadMapLibreRuntime");
    expect(owner).toContain('import("./MapLibreAdapterRuntime")');
    expect(owner).not.toContain('import * as maplibregl from "maplibre-gl"');
    expect(runtime).toContain('import * as maplibregl from "maplibre-gl"');
    expect(runtime).not.toContain("maplibre-gl/dist/maplibre-gl.css");
    expect(runtime).toContain("setMissingStyleImageResolver");
    expect(barrel).toContain("from './MapLibreAdapter'");
    expect(barrel).not.toContain("LazyMapLibreAdapter");
    expect(fs.existsSync(path.resolve(ROOT, LEGACY_ADAPTER_BRIDGE))).toBe(false);
  });

  it("keeps migrated imperative consumers behind the canonical runtime loader", () => {
    for (const sourcePath of MIGRATED_CONSUMERS) {
      const source = readProjectFile(sourcePath);
      expect(source).not.toMatch(STATIC_MAPLIBRE_IMPORT);
      expect(source).not.toMatch(STATIC_MAPLIBRE_CSS_IMPORT);
      expect(source).toContain("loadMapLibreRuntime");
    }
  });

  it("forbids new static MapLibre engine or CSS owners outside the canonical core", () => {
    const violations = collectSourceFiles("src").flatMap((sourcePath) => {
      const source = readProjectFile(sourcePath);
      const reasons: string[] = [];

      if (
        STATIC_MAPLIBRE_IMPORT.test(source) &&
        sourcePath !== ALLOWED_STATIC_RUNTIME_OWNER
      ) {
        reasons.push(`${sourcePath}:runtime`);
      }

      if (
        STATIC_MAPLIBRE_CSS_IMPORT.test(source) &&
        sourcePath !== ALLOWED_STATIC_CSS_OWNER
      ) {
        reasons.push(`${sourcePath}:css`);
      }

      return reasons;
    });

    expect(violations).toEqual([]);
  });
});
