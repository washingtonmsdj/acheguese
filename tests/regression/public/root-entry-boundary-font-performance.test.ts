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

  it("keeps Google Fonts entirely outside the root initial network window", () => {
    const postcss = read("postcss.config.cjs");
    const html = read("index.html");
    const main = read("src/main.tsx");

    expect(postcss).toContain("strip-duplicate-google-font-import");
    expect(postcss).toContain('atRule.params.includes("fonts.googleapis.com")');
    expect(postcss).toContain("atRule.remove()");

    expect(html).toContain("data-public-font-stylesheet");
    expect(html).toContain("display=optional");
    expect(html).not.toContain('data-public-font-stylesheet\n      href=');
    expect(html).not.toContain('fetchpriority="low"');
    expect(html).not.toContain('rel="preconnect" href="https://fonts.googleapis.com"');
    expect(html).not.toContain('rel="preconnect" href="https://fonts.gstatic.com"');
    expect(html).not.toContain("font-bootstrap.js");
    expect(fs.existsSync(path.join(ROOT, "public/font-bootstrap.js"))).toBe(false);

    expect(main).toContain('meta[data-public-font-stylesheet]');
    expect(main).toContain('document.createElement("link")');
    expect(main).toContain('stylesheet.rel = "stylesheet"');
    expect(main).toContain("scheduleAfterPublicRootMap(loadOptionalFontStylesheet");
    expect(main).toContain("maxWaitMs: 2400");
  });

  it("keeps monitoring out of the deferred bootstrap utility", () => {
    const deferred = read("src/shared/utils/deferredInit.ts");

    expect(deferred).not.toContain('import { logger } from "@/shared/utils/logger"');
    expect(deferred).toContain('import("@/shared/utils/logger")');
    expect(deferred).toContain("reportDeferredError");
  });
});
