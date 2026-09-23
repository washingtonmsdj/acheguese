import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { APP_MODULE_SLUGS } from "@/shared/config/moduleSlugs";
import {
  TERRITORIAL_ROUTE_PARAMS,
  TERRITORIAL_ROUTE_STATIC_SEGMENTS,
  buildCommunityAliasRoutePath,
  buildCommunityTerritoryRoutePath,
} from "@/core/routing/config/territorialRoutePatterns";

const currentDir = resolve(fileURLToPath(import.meta.url), "..");
const repoRoot = resolve(currentDir, "../../../..");

function readProjectFile(path: string): string {
  return readFileSync(resolve(repoRoot, path), "utf8");
}

describe("community route patterns", () => {
  it("keeps Community route patterns in the routing SSOT", () => {
    expect(buildCommunityTerritoryRoutePath()).toBe(
      "/comunidade/:state/:city",
    );
    expect(
      buildCommunityTerritoryRoutePath([TERRITORIAL_ROUTE_STATIC_SEGMENTS.feed]),
    ).toBe("/comunidade/:state/:city/feed");
    expect(
      buildCommunityTerritoryRoutePath([
        TERRITORIAL_ROUTE_PARAMS.groupSlugOrDistrict,
      ]),
    ).toBe("/comunidade/:state/:city/:groupSlugOrDistrict");
    expect(
      buildCommunityTerritoryRoutePath([
        TERRITORIAL_ROUTE_PARAMS.groupSlugOrDistrict,
        TERRITORIAL_ROUTE_STATIC_SEGMENTS.feed,
      ]),
    ).toBe("/comunidade/:state/:city/:groupSlugOrDistrict/feed");
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

    expect(buildCommunityAliasRoutePath()).toBe(
      "/comunidade/:communitySlug",
    );
    expect(buildCommunityAliasRoutePath(["*"])).toBe(
      "/comunidade/:communitySlug/*",
    );
    expect(
      buildCommunityAliasRoutePath([TERRITORIAL_ROUTE_STATIC_SEGMENTS.feed]),
    ).toBe("/comunidade/:communitySlug/feed");
    expect(
      buildCommunityAliasRoutePath([APP_MODULE_SLUGS.business]),
    ).toBe("/comunidade/:communitySlug/empresas");
    expect(
      buildCommunityAliasRoutePath([APP_MODULE_SLUGS.jobs, "*"]),
    ).toBe("/comunidade/:communitySlug/vagas/*");
  });

  it("keeps post-MVP route patterns disconnected from the active public router", () => {
    const appRoutes = readProjectFile("src/app/routes/AppRoutes.tsx");
    const appLayout = readProjectFile(
      "src/app/routes/sections/AppLayoutRoutes.tsx",
    );
    const activeLazy = readProjectFile("src/app/routes/activeLazyImports.ts");

    expect(
      existsSync(
        resolve(repoRoot, "src/app/routes/sections/CommunityTerritoryRoutes.tsx"),
      ),
    ).toBe(false);
    expect(
      existsSync(resolve(repoRoot, "src/core/community-feed/pages/ComunidadePage.tsx")),
    ).toBe(true);

    for (const forbidden of [
      "CommunityTerritoryRoutes",
      "CommunityPersistentPortalLayout",
      "CommunityTerritorialShell",
      "CommunityAliasRoute",
      "TerritorialCommunityPage",
    ]) {
      expect(appRoutes).not.toContain(forbidden);
      expect(appLayout).not.toContain(forbidden);
      expect(activeLazy).not.toContain(forbidden);
    }
  });

  it("does not keep legacy Community paths in the active route graph", () => {
    const routesSource = [
      readProjectFile("src/app/routes/AppRoutes.tsx"),
      readProjectFile("src/app/routes/sections/AppLayoutRoutes.tsx"),
    ].join("\n");

    expect(routesSource).not.toContain("buildCommunityLegacyAreaRoutePath");
    expect(routesSource).not.toContain("CommunityAreaCanonicalRedirect");
    expect(routesSource).not.toContain("buildCommunityRootAliasRoutePath");
    expect(routesSource).not.toContain("CommunityShortAliasShellRoute");
    expect(routesSource).not.toContain("CommunityShortEntityRoute");
    expect(routesSource).not.toContain(
      'path="/comunidade/:state/:city/area/:groupSlug/*"',
    );
    expect(routesSource).not.toContain('path="/comunidade"');
    expect(routesSource).not.toContain('path="/comunidade/grupos"');
    expect(routesSource).not.toContain('path="/comunidade/problemas"');
  });
});
