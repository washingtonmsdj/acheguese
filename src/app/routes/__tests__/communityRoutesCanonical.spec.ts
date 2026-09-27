import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { APP_MODULE_SLUGS } from "@/shared/config/moduleSlugs";
import {
  TERRITORIAL_ROUTE_STATIC_SEGMENTS,
  buildScopedTerritorialModuleRoutePath,
  buildTerritorialModuleRoutePath,
} from "@/core/routing/config/territorialRoutePatterns";

const currentDir = resolve(fileURLToPath(import.meta.url), "..");
const repoRoot = resolve(currentDir, "../../../..");

function readProjectFile(path: string): string {
  return readFileSync(resolve(repoRoot, path), "utf8");
}

describe("community route patterns", () => {
  it("keeps Community under the canonical territory hierarchy", () => {
    expect(buildTerritorialModuleRoutePath(APP_MODULE_SLUGS.community)).toBe(
      "/:state/:city/comunidade",
    );
    expect(
      buildTerritorialModuleRoutePath(APP_MODULE_SLUGS.community, [
        TERRITORIAL_ROUTE_STATIC_SEGMENTS.feed,
      ]),
    ).toBe("/:state/:city/comunidade/feed");
    expect(
      buildScopedTerritorialModuleRoutePath(APP_MODULE_SLUGS.community),
    ).toBe("/:state/:city/:territorySlug/comunidade");
    expect(
      buildScopedTerritorialModuleRoutePath(APP_MODULE_SLUGS.community, [
        TERRITORIAL_ROUTE_STATIC_SEGMENTS.feed,
      ]),
    ).toBe("/:state/:city/:territorySlug/comunidade/feed");
    expect(
      buildScopedTerritorialModuleRoutePath(APP_MODULE_SLUGS.community, [
        TERRITORIAL_ROUTE_STATIC_SEGMENTS.groups,
        ":id",
      ]),
    ).toBe("/:state/:city/:territorySlug/comunidade/grupos/:id");
  });

  it("keeps post-MVP Community disconnected from the active public router", () => {
    const appRoutes = readProjectFile("src/app/routes/AppRoutes.tsx");
    const appLayout = readProjectFile(
      "src/app/routes/sections/AppLayoutRoutes.tsx",
    );
    const activeLazy = readProjectFile("src/app/routes/activeLazyImports.ts");
    const territoryConfig = readProjectFile("src/core/routing/config/territory.ts");

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
      expect(territoryConfig).not.toContain(forbidden);
    }
  });

  it("does not keep legacy Community paths in the active route graph", () => {
    const routesSource = [
      readProjectFile("src/app/routes/AppRoutes.tsx"),
      readProjectFile("src/app/routes/sections/AppLayoutRoutes.tsx"),
    ].join("\n");

    for (const forbidden of [
      "buildCommunityLegacyAreaRoutePath",
      "CommunityAreaCanonicalRedirect",
      "buildCommunityRootAliasRoutePath",
      "CommunityShortAliasShellRoute",
      "CommunityShortEntityRoute",
      'path="/comunidade/:',
      'path="/comunidade"',
      "LAUNCH_COMMUNITY_PUBLIC_PATH",
    ]) {
      expect(routesSource).not.toContain(forbidden);
    }
  });
});
