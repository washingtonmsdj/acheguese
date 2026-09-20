import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const read = (relativePath: string) =>
  fs.readFileSync(path.join(ROOT, relativePath), "utf8");

describe("public root production bundle analysis", () => {
  it("emits a Vite manifest only when bundle analysis is requested", () => {
    const vite = read("vite.config.ts");

    expect(vite).toContain("const shouldAnalyzeBundle");
    expect(vite).toContain("manifest: shouldAnalyzeBundle");
    expect(vite).toContain("rollup-plugin-visualizer");
    expect(vite).toContain('filename: "./dist/stats.html"');
  });

  it("reports initial, first-map, boundary and deferred vendor sizes", () => {
    const reporter = read("tools/performance/report-root-bundle.mjs");

    expect(reporter).toContain('"dist", ".vite", "manifest.json"');
    expect(reporter).toContain("gzipSync");
    expect(reporter).toContain("brotliCompressSync");
    expect(reporter).toContain('"initial-bootstrap"');
    expect(reporter).toContain('"territory-map-runtime"');
    expect(reporter).toContain('"passive-map-runtime"');
    expect(reporter).toContain('"maplibre-engine"');
    expect(reporter).toContain('"official-boundary"');
    expect(reporter).toContain("firstUsableMap");
    expect(reporter).toContain("root-bundle-report.json");
    expect(reporter).toContain("GITHUB_STEP_SUMMARY");
  });

  it("fails analysis when deferred runtimes leak into critical public-root closures", () => {
    const reporter = read("tools/performance/report-root-bundle.mjs");

    expect(reporter).toContain("fullMapRuntimeDeferredFromFirstUsableMap");
    expect(reporter).toContain("officialBoundaryDeferredFromFirstUsableMap");
    expect(reporter).toContain("routedAppRuntimeDeferredFromInitialBootstrap");
    expect(reporter).toContain("sentryDeferredFromInitialBootstrap");
    expect(reporter).toContain("firstUsableMapManifestKeys");
    expect(reporter).toContain("initialManifestKeys");
    expect(reporter).toContain("failedInvariants");
    expect(reporter).toContain("process.exitCode = 1");
  });

  it("keeps source boundaries compatible with the manifest separation contract", () => {
    const mapHook = read("src/core/maps/hooks/useTerritoryPolygon.ts");
    const adapter = read("src/core/maps/components/v3/MapLibreAdapter.tsx");
    const runtime = read("src/app/components/AppRuntime.tsx");
    const main = read("src/main.tsx");

    expect(mapHook).toContain(
      'await import(\n    "@/core/geospatial/data/officialFeatureServerBoundary"',
    );
    expect(mapHook).toContain(
      'await import(\n    "@/core/geospatial/services/BoundaryService"',
    );
    expect(adapter).toContain('import("./MapLibrePassiveRuntime")');
    expect(adapter).toContain('import("./MapLibreAdapterRuntime")');
    expect(runtime).toContain('import("@/app/components/RoutedAppRuntime")');
    expect(main).toContain("scheduleAfterPublicRootMap(initializeObservability");
  });

  it("runs production build analysis inside the existing explicit-SHA heavy certification", () => {
    const workflow = read(".github/workflows/certify-heavy.yml");

    expect(workflow).toContain("Build production bundle with analysis manifest");
    expect(workflow).toContain('ANALYZE_BUNDLE: "true"');
    expect(workflow).toContain("run: npm run build");
    expect(workflow).toContain("Report public root bundle sizes");
    expect(workflow).toContain("node tools/performance/report-root-bundle.mjs");
    expect(workflow).toContain("dist/root-bundle-report.json");
    expect(workflow).toContain("dist/root-bundle-report.md");
    expect(workflow).toContain("dist/stats.html");
    expect(workflow).toContain("dist/.vite/manifest.json");
  });
  it("keeps exact-SHA self-hosted certification equivalent to core release gates", () => {
    const workflow = read(".github/workflows/certify-heavy.yml");

    for (const required of [
      "Run static security, lint and type gates",
      '@("run", "security:validate")',
      '@("run", "lint")',
      '@("run", "typecheck")',
      "Run architecture and SSOT gates",
      '@("run", "validate:deps")',
      '@("run", "validate:ssot")',
      "Validate canonical migration chain and remote parity",
      "SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}",
      "SUPABASE_DB_PASSWORD: ${{ secrets.SUPABASE_DB_PASSWORD }}",
      "npm run validate:migrations",
      "npm run validate:migrations:provenance",
      "npm run test:migrations:provenance",
      "npx supabase link --project-ref xhdowzacfujckjelqhtd",
      "npm run validate:migrations:remote",
      "Run complete unit and integration test suite",
      "npm run test",
    ]) {
      expect(workflow).toContain(required);
    }

    expect(workflow).toContain("- self-hosted");
    expect(workflow).toContain("- acheguese-heavy-windows");
    expect(workflow).toContain("- remote-only");
    expect(workflow).not.toContain("runs-on: ubuntu-latest");
  });

});
