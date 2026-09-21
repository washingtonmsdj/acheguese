import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("MVP core module boundary", () => {
  const registry = read("src/app/config/productModuleRegistry.ts");
  const launchScope = read("src/app/config/launchScope.ts");
  const home = read("src/app/pages/TerritoryHomePage.tsx");
  const map = read("src/core/maps/pages/MapaPageV4.tsx");
  const nearby = read("src/core/nearby/pages/NearbyPage.tsx");
  const sidebar = read("src/app/components/navigation/AppSidebar.tsx");
  const territoryNavigation = read(
    "src/core/navigation/territoryNavigationModes.ts",
  );
  const appRoutes = read("src/app/routes/sections/AppLayoutRoutes.tsx");

  it("keeps lifecycle ownership centralized and Nearby dependent on Map + Business", () => {
    expect(registry).toContain('business: { status: "active" }');
    expect(registry).toContain('map: { status: "active" }');
    expect(registry).toContain(
      'nearby: { status: "active", dependsOn: ["map", "business"] }',
    );
    expect(registry).toContain('search: { status: "paused" }');
    expect(registry).toContain('community: { status: "paused" }');
    expect(registry).toContain('classifieds: { status: "paused" }');

    expect(launchScope).toContain(
      'business: isProductModuleEnabled("business")',
    );
    expect(launchScope).toContain('map: isProductModuleEnabled("map")');
    expect(launchScope).toContain('nearby: isProductModuleEnabled("nearby")');
  });

  it("keeps the active Home limited to the three MVP product modules", () => {
    expect(home).toContain("MODULE_SLUGS.business");
    expect(home).toContain("MODULE_SLUGS.map");
    expect(home).toContain("APP_MODULE_SLUGS.nearby");

    for (const forbidden of [
      "useTerritoryHomeData",
      "useCommunityAccess",
      "classifiedUrlService",
      "eventsReadService",
      "WorkOpportunitiesService",
      "MODULE_SLUGS.services",
      "MODULE_SLUGS.classifieds",
      "MODULE_SLUGS.gastronomy",
      "MODULE_SLUGS.events",
      "MODULE_SLUGS.jobs",
      "MODULE_SLUGS.search",
    ]) {
      expect(home).not.toContain(forbidden);
    }

    expect(
      existsSync(
        resolve(root, "src/core/landing/hooks/useTerritoryHomeData.ts"),
      ),
    ).toBe(false);
    expect(
      existsSync(
        resolve(root, "src/core/landing/utils/territoryHomeFreshness.ts"),
      ),
    ).toBe(false);
  });

  it("keeps Map independent from paused product owners", () => {
    expect(map).toContain("mapBusinessLayerRuntimeService");
    expect(map).toContain("makeBusinessFetcher");

    for (const forbidden of [
      "mapGastronomyLayerRuntimeService",
      "mapServicesLayerRuntimeService",
      "mapClassifiedsLayerRuntimeService",
      "eventsReadService",
      "eventPublicRoutes",
      "spatialSearchService",
      "useTouristPointPublicUrls",
      "makeGastronomyFetcher",
      "makeServicesFetcher",
      "makeClassifiedsFetcher",
      "makeEventsFetcher",
      "COMMUNITY_MODULE_TABS",
      "moduleUrls.community",
    ]) {
      expect(map).not.toContain(forbidden);
    }
  });

  it("keeps Nearby as a Business proximity adapter instead of a second discovery platform", () => {
    expect(nearby).toContain("useNearbyBusinesses");
    expect(nearby).toContain("buildLocationModuleUrl");
    expect(nearby).toContain("MODULE_SLUGS.business");
    expect(nearby).toContain("MODULE_SLUGS.map");
    expect(nearby).toContain('seeAllLabel="Abrir mapa"');
    expect(nearby).not.toContain("useFriendlyModuleUrls");

    for (const forbidden of [
      "NearbyClassifiedsSection",
      "useNearbyEntities",
      "moduleUrls.services",
      "moduleUrls.classifieds",
      "moduleUrls.gastronomy",
      "eventsReadService",
      "WorkOpportunitiesService",
    ]) {
      expect(nearby).not.toContain(forbidden);
    }
  });

  it("does not query paused module availability from the active sidebar", () => {
    for (const forbidden of [
      "useGroupAvailability",
      "communityContext",
      "GastronomyUrlService",
      "GuideSidebarItem",
      "ModuleKey",
      "buildCommunityNavigationModuleUrls",
    ]) {
      expect(sidebar).not.toContain(forbidden);
    }
  });

  it("keeps active modules behind the same lifecycle gate used by paused modules", () => {
    expect(appRoutes).toContain(
      'element={launchElement("business", "Empresas", <P.EmpresasLandingPage />)}',
    );
    expect(appRoutes).toContain(
      'element={launchElement("map", "Mapa", <P.MapaPage />)}',
    );
    expect(appRoutes).toContain(
      'element={launchElement("nearby", "Perto de mim", <P.NearbyPage />)}',
    );
    expect(appRoutes).toContain(
      '"business",\n            "Empresas",\n            protectedElement(<P.EmpresasCadastroLandingPage />)',
    );
  });

  it("keeps primary territorial navigation on the MVP core", () => {
    for (const id of ['"home"', '"map"', '"business"', '"nearby"', '"account"']) {
      expect(territoryNavigation).toContain(`id: ${id}`);
    }

    expect(territoryNavigation).not.toContain('id: "community"');
    expect(territoryNavigation).not.toContain('id: "explore"');
    expect(territoryNavigation).not.toContain('id: "activity"');
    expect(territoryNavigation).not.toContain('MODULE_SLUGS.search');
  });
});
