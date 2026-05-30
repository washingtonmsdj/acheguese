import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  TERRITORIAL_ROUTE_PARAMS,
  TERRITORIAL_ROUTE_STATIC_SEGMENTS,
  buildCommunityTerritoryRoutePath,
} from "@/core/routing/config/territorialRoutePatterns";

const currentDir = resolve(fileURLToPath(import.meta.url), "..");
const repoRoot = resolve(currentDir, "../../../..");

function readProjectFile(path: string): string {
  return readFileSync(resolve(repoRoot, path), "utf8");
}

describe("community canonical routes", () => {
  it("keeps canonical community route patterns in routing SSOT", () => {
    expect(buildCommunityTerritoryRoutePath()).toBe(
      "/comunidade/:state/:city",
    );
    expect(
      buildCommunityTerritoryRoutePath([TERRITORIAL_ROUTE_STATIC_SEGMENTS.feed]),
    ).toBe("/comunidade/:state/:city/feed");
    expect(
      buildCommunityTerritoryRoutePath([
        TERRITORIAL_ROUTE_STATIC_SEGMENTS.groups,
        TERRITORIAL_ROUTE_PARAMS.id,
      ]),
    ).toBe("/comunidade/:state/:city/grupos/:id");
    expect(
      buildCommunityTerritoryRoutePath([
        TERRITORIAL_ROUTE_STATIC_SEGMENTS.issues,
      ]),
    ).toBe("/comunidade/:state/:city/problemas");
    expect(
      buildCommunityTerritoryRoutePath([
        TERRITORIAL_ROUTE_STATIC_SEGMENTS.lostAndFound,
      ]),
    ).toBe("/comunidade/:state/:city/achados-e-perdidos");
  });

  it("does not hardcode canonical community local route strings in AppRoutes", () => {
    const routesSource = readProjectFile("src/app/routes/AppRoutes.tsx");

    expect(routesSource).toContain("buildCommunityTerritoryRoutePath()");
    expect(routesSource).toContain(
      "buildCommunityTerritoryRoutePath([TERRITORIAL_STATIC.feed])",
    );
    expect(routesSource).toContain(
      "buildCommunityTerritoryRoutePath([TERRITORIAL_STATIC.groups, TERRITORIAL_PARAMS.id])",
    );
    expect(routesSource).not.toContain(
      'path="/comunidade/:state/:city/:territorySlug"',
    );
    expect(routesSource).not.toContain(
      'path="/comunidade/:state/:city/:territorySlug/feed"',
    );
  });

  it("does not keep legacy community paths", () => {
    const routesSource = readProjectFile("src/app/routes/AppRoutes.tsx");

    expect(routesSource).not.toContain("buildCommunityLegacyAreaRoutePath");
    expect(routesSource).not.toContain("CommunityAreaCanonicalRedirect");
    expect(routesSource).not.toContain('path="/comunidade/:state/:city/area/:groupSlug/*"');
    expect(routesSource).not.toContain('path="/comunidade"');
    expect(routesSource).not.toContain('path="/comunidade/grupos"');
    expect(routesSource).not.toContain('path="/comunidade/problemas"');
  });
});
