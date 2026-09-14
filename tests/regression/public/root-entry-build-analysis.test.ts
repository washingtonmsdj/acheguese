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
});
