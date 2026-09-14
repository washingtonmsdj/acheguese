import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const read = (p: string) => fs.readFileSync(path.join(ROOT, p), "utf8");

describe("root boundary and font performance", () => {
  it("loads official group boundaries in one lightweight batch before backend fallback", () => {
    const hook = read("src/core/maps/hooks/useTerritoryPolygon.ts");
    const loader = read("src/core/geospatial/data/officialFeatureServerBoundary.ts");

    expect(hook).toContain("fetchOfficialSourcePolygons");
    expect(hook).toContain("loadOfficialFeatureServerBoundaries");
    expect(hook.indexOf("loadOfficialFeatureServerBoundaries")).toBeLessThan(
      hook.indexOf("@/core/geospatial/services/BoundaryService"),
    );

    expect(loader).toContain("OBJECTID IN (");
    expect(loader).toContain('outFields: "OBJECTID"');
    expect(loader).toContain('geometryPrecision: "6"');
    expect(loader).toContain('returnZ: "false"');
    expect(loader).toContain('returnM: "false"');
    expect(loader).toContain("pendingBatches");
    expect(loader).toContain("boundaryCache");
    expect(loader).not.toContain("@/integrations/supabase");
  });

  it("keeps Google Fonts out of render-blocking CSS", () => {
    const postcss = read("postcss.config.cjs");
    const html = read("index.html");
    const bootstrap = read("public/font-bootstrap.js");

    expect(postcss).toContain("strip-duplicate-google-font-import");
    expect(postcss).toContain('atRule.params.includes("fonts.googleapis.com")');
    expect(postcss).toContain("atRule.remove()");

    expect(html).toContain('rel="preload"');
    expect(html).toContain('as="style"');
    expect(html).toContain("data-public-font-stylesheet");
    expect(html).toContain('fetchpriority="low"');
    expect(html).toContain("display=optional");
    expect(html).toContain('<script src="/font-bootstrap.js" defer></script>');
    expect(html).not.toContain(
      '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans',
    );

    expect(bootstrap).toContain('link.rel = "stylesheet"');
    expect(bootstrap).toContain("requestAnimationFrame");
  });
});
