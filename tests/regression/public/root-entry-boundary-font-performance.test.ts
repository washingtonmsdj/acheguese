import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const read = (p: string) => fs.readFileSync(path.join(ROOT, p), "utf8");

describe("root boundary and font performance", () => {
  it("keeps official group boundary infrastructure lazy for actual map surfaces", () => {
    const hook = read("src/core/maps/hooks/useTerritoryPolygon.ts");
    const loader = read("src/core/geospatial/data/officialFeatureServerBoundary.ts");
    const entry = read("src/app/pages/TerritoryEntryPage.tsx");

    expect(hook).toContain("fetchOfficialSourcePolygons");
    expect(hook).toContain("loadOfficialFeatureServerBoundaries");
    expect(loader).toContain("OBJECTID IN (");
    expect(loader).toContain('outFields: "OBJECTID"');
    expect(loader).toContain("pendingBatches");
    expect(loader).toContain("boundaryCache");
    expect(loader).not.toContain("@/integrations/supabase");

    expect(entry).not.toContain("useTerritoryPolygon");
    expect(entry).not.toContain("<TerritoryEntryMap");
  });

  it("keeps Google Fonts outside the landing initial network window", () => {
    const html = read("index.html");
    const main = read("src/main.tsx");
    const css = read("src/index.css");

    expect(html).toContain("data-public-font-stylesheet");
    expect(html).toContain("display=optional");
    expect(html).not.toContain('rel="preconnect" href="https://fonts.googleapis.com"');
    expect(html).not.toContain('rel="preconnect" href="https://fonts.gstatic.com"');
    expect(html).not.toContain("font-bootstrap.js");
    expect(fs.existsSync(path.join(ROOT, "public/font-bootstrap.js"))).toBe(false);

    expect(css).not.toContain('@import url("https://fonts.googleapis.com');
    expect(main).toContain('meta[data-public-font-stylesheet]');
    expect(main).toContain('stylesheet.rel = "stylesheet"');
    expect(main).toContain("deferLoad(loadOptionalFontStylesheet)");
    expect(main).not.toContain("scheduleAfterPublicRootMap(loadOptionalFontStylesheet");
  });

  it("keeps map networking off the shared document head", () => {
    const html = read("index.html");
    const main = read("src/main.tsx");

    expect(html).not.toContain("tiles.openfreemap.org");
    expect(html).not.toContain("services6.arcgis.com");
    expect(main).not.toContain("DEFAULT_TILE_STYLE");
    expect(main).not.toContain("OPENFREEMAP_TILEJSON_URL");
    expect(main).not.toContain("data-entry-map-style-preload");
    expect(main).not.toContain("data-entry-map-tilejson-preload");
  });

  it("keeps monitoring out of the deferred bootstrap utility", () => {
    const deferred = read("src/shared/utils/deferredInit.ts");

    expect(deferred).not.toContain('import { logger } from "@/shared/utils/logger"');
    expect(deferred).toContain('import("@/shared/utils/logger")');
    expect(deferred).toContain("reportDeferredError");
  });
});
