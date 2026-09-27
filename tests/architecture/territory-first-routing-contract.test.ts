import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

import { APP_MODULE_SLUGS, getAppModuleSlugFromPath } from "@/shared/config/moduleSlugs";
import {
  buildScopedTerritorialModuleRoutePath,
  buildTerritorialModuleRoutePath,
} from "@/core/routing/config/territorialRoutePatterns";
import {
  buildModuleTerritoryEntityUrl,
  buildModuleTerritoryUrl,
} from "@/core/routing/utils/territoryUrls";

const ROOT = process.cwd();
const SRC_ROOT = join(ROOT, "src");

function runtimeSourceFiles(dir = SRC_ROOT): string[] {
  const files: string[] = [];

  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);

    if (stat.isDirectory()) {
      if (entry === "__tests__" || entry === "test" || entry === "tests") continue;
      files.push(...runtimeSourceFiles(full));
      continue;
    }

    if (!/\.(?:ts|tsx)$/.test(entry) || /\.(?:spec|test)\.(?:ts|tsx)$/.test(entry)) {
      continue;
    }

    files.push(full);
  }

  return files;
}

const MODULE_FIRST_ROUTE_LITERAL =
  /["'`]\/(?:empresas|mapa|perto-de-mim|busca|comunidade|servicos|eventos|classificados|gastronomia|vagas|pontos-turisticos)\/:state\/:city/;

describe("territory-first public routing contract", () => {
  it("builds city, scoped territory and entity URLs with territory before module", () => {
    expect(buildTerritorialModuleRoutePath(APP_MODULE_SLUGS.business)).toBe(
      "/:state/:city/empresas",
    );
    expect(buildScopedTerritorialModuleRoutePath(APP_MODULE_SLUGS.map)).toBe(
      "/:state/:city/:district/mapa",
    );
    expect(
      buildModuleTerritoryUrl(
        APP_MODULE_SLUGS.nearby,
        "/ba/salvador/complexo-do-nordeste-de-amaralina",
      ),
    ).toBe(
      "/ba/salvador/complexo-do-nordeste-de-amaralina/perto-de-mim",
    );
    expect(
      buildModuleTerritoryEntityUrl(
        APP_MODULE_SLUGS.business,
        "/ba/salvador/pituba",
        "padaria-x",
      ),
    ).toBe("/ba/salvador/pituba/empresas/padaria-x");
  });

  it("rejects module-first territorial paths as module context", () => {
    for (const retired of [
      "/empresas/ba/salvador/pituba",
      "/mapa/ba/salvador/pituba",
      "/perto-de-mim/ba/salvador/pituba",
      "/busca/ba/salvador/pituba",
      "/comunidade/ba/salvador/pituba",
    ]) {
      expect(getAppModuleSlugFromPath(retired)).toBeNull();
    }
  });

  it("keeps retired alias and redirect authorities out of runtime source", () => {
    const forbiddenRuntimeMarkers = [
      "LAUNCH_COMMUNITY_PUBLIC_PATH",
      "CommunityAliasRoute",
      "CommunityAliasShellRoute",
      "CommunityEntityAliasRoute",
      "decideLegacyEntityRoute",
      "LegacyEntityRouteDecision",
      "community_public_aliases",
    ];

    const violations: string[] = [];

    for (const file of runtimeSourceFiles()) {
      const source = readFileSync(file, "utf8");
      const path = relative(ROOT, file);

      for (const marker of forbiddenRuntimeMarkers) {
        if (source.includes(marker)) {
          violations.push(`${path}: ${marker}`);
        }
      }

      if (MODULE_FIRST_ROUTE_LITERAL.test(source)) {
        violations.push(`${path}: module-first territorial route literal`);
      }
    }

    expect(violations).toEqual([]);
  });

  it("does not special-case the launch territory outside the canonical territorial router", () => {
    const rootRoutes = readFileSync(
      join(ROOT, "src/app/routes/AppRoutes.tsx"),
      "utf8",
    );
    const layoutRoutes = readFileSync(
      join(ROOT, "src/app/routes/sections/AppLayoutRoutes.tsx"),
      "utf8",
    );

    expect(rootRoutes).not.toContain("LAUNCH_COMMUNITY_PUBLIC_PATH");
    expect(rootRoutes).not.toContain("TerritoryPortalPage");
    expect(layoutRoutes).toContain("buildTerritorialBareRoutePath");
    expect(layoutRoutes).toContain("<TerritoryHomePage />");
  });
});
