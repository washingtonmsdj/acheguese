import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const read = (relativePath: string) =>
  fs.readFileSync(path.join(ROOT, relativePath), "utf8");

describe("official boundary priority", () => {
  it("keeps the four launch neighborhoods pinned to GeoSalvador ids", () => {
    const fallback = read("src/core/routing/utils/publicTerritoryFallbacks.ts");

    expect(fallback).toContain("services6.arcgis.com");
    for (const objectId of [54, 112, 142, 163]) {
      expect(fallback).toContain(`sourceObjectId: ${objectId}`);
    }
  });

  it("prefers official metadata before canonical database fallback", () => {
    const service = read("src/core/geospatial/services/BoundaryService.ts");
    const fallbackBranchStart = service.indexOf(
      "if (isPublicFallbackLocation(location))",
    );
    const sourceLookup = service.indexOf(
      "await this.getMetadataSourceBoundary(location)",
      fallbackBranchStart,
    );
    const canonicalLookup = service.indexOf(
      "await this.resolveCanonicalLocationForFallback(location)",
      fallbackBranchStart,
    );

    expect(fallbackBranchStart).toBeGreaterThanOrEqual(0);
    expect(sourceLookup).toBeGreaterThan(fallbackBranchStart);
    expect(canonicalLookup).toBeGreaterThan(sourceLookup);
  });

  it("does not preconnect map or official-boundary hosts on every SPA route", () => {
    const html = read("index.html");

    expect(html).not.toContain('rel="preconnect" href="https://tiles.openfreemap.org"');
    expect(html).not.toContain('rel="preconnect" href="https://services6.arcgis.com"');
    expect(html).not.toContain('rel="dns-prefetch" href="//services6.arcgis.com"');
  });
});
