import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

function read(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

describe("Territory Home ownership", () => {
  it("keeps TerritoryHomePage as the only city/district Home owner", () => {
    const appRoutes = read("src/app/routes/AppRoutes.tsx");
    const layoutRoutes = read("src/app/routes/sections/AppLayoutRoutes.tsx");

    expect(layoutRoutes).toContain("element={<TerritoryHomePage />}");
    expect(layoutRoutes).not.toContain("TerritorialIndexPage");
    expect(layoutRoutes).not.toContain("CityLandingComponent");
    expect(appRoutes).toContain(
      '<Route path="/" element={<RootRouteEntry />} />',
    );
  });

  it("does not recreate retired competing Home owners", () => {
    for (const relativePath of [
      "src/app/pages/PublicCityLandingPage.tsx",
      "src/app/pages/PublicCityLandingPage.css",
      "src/app/pages/TerritoryExplorerPage.tsx",
      "src/app/pages/NationalHubPage.tsx",
    ]) {
      expect(fs.existsSync(path.join(ROOT, relativePath)), relativePath).toBe(
        false,
      );
    }
  });

  it("does not keep stale route/import aliases for retired Home owners", () => {
    const prefetch = read("src/app/routes/prefetch.ts");
    const activeLazyImports = read("src/app/routes/activeLazyImports.ts");
    const routes = read("src/app/routes/sections/AppLayoutRoutes.tsx");

    expect(prefetch).not.toContain("PublicCityLandingPage");
    expect(prefetch).not.toContain("TerritoryExplorerPage");
    expect(activeLazyImports).not.toContain("NationalHubPage");
    expect(routes).not.toContain('path="/inicio"');
  });

  it("keeps hero navigation limited to active MVP surfaces without paused presentation API", () => {
    const portal = read("src/app/pages/TerritoryPortalPage.tsx");
    const hero = read("src/app/components/territorial/TerritorialModuleHero.tsx");
    const navigation = read("src/app/components/territorial/TerritoryModuleNav.tsx");
    const barrel = read("src/app/components/territorial/index.ts");

    for (const activeId of ["home", "map", "business", "nearby", "search"]) {
      expect(portal).toContain(`id: "${activeId}"`);
    }

    expect(portal).not.toContain('id: "community"');
    expect(portal).not.toContain("moreNavItems");
    expect(portal).not.toContain("TerritoryModuleNavMoreItem");

    expect(hero).not.toContain("moreNavItems");
    expect(hero).not.toContain("moreItems=");
    expect(hero).not.toContain("TerritoryModuleNavMoreItem");

    expect(navigation).toContain(
      'const ACTIVE_MVP_NAV_IDS = ["business", "nearby", "map", "search"] as const;',
    );
    expect(navigation).toContain("href: string;");
    expect(navigation).not.toContain("disabled?:");
    expect(navigation).not.toContain("badge?:");
    expect(navigation).not.toContain("moreItems?:");
    expect(navigation).not.toContain("Em breve");
    expect(barrel).not.toContain("TerritoryModuleNavMoreItem");
  });
});
