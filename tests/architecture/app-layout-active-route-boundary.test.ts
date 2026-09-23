import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

const appLayout = read("src/app/routes/sections/AppLayoutRoutes.tsx");
const routeRegistry = read(
  "src/app/routes/sections/AppLayoutRouteRegistry.tsx",
);
const activeLazyImports = read("src/app/routes/activeLazyImports.ts");
const prefetch = read("src/app/routes/prefetch.ts");
const activeTerritorialPages = read(
  "src/app/routes/territorial/ActiveTerritorialModulePages.tsx",
);

describe("active AppLayout route boundary", () => {
  it("does not mount paused product modules or paused fallbacks", () => {
    expect(
      existsSync("src/app/routes/sections/CommunityTerritoryRoutes.tsx"),
    ).toBe(false);
    expect(existsSync("src/app/routes/lazyImports.ts")).toBe(false);
    expect(
      existsSync("src/app/routes/territorial/TerritorialModulePages.tsx"),
    ).toBe(false);
    expect(existsSync("src/app/routes/launchPausedComponent.ts")).toBe(false);
    expect(existsSync("src/app/pages/LaunchPausedPage.tsx")).toBe(false);

    for (const forbidden of [
      "DIRECT_PAUSED_ROUTES",
      "LaunchPausedPage",
      "launchElement(",
      "CommunityTerritoryRoutes",
      "mobilityRoutes",
      "gastronomyPublicRoutes",
      "professionalPublicRoutes",
      "touristPointPublicRoutes",
      "isFeatureEnabled",
      '"../lazyImports"',
    ]) {
      expect(appLayout).not.toContain(forbidden);
    }

    for (const pausedPath of [
      'path="/planos"',
      'path="/classificados',
      'path="/servicos',
      'path="/educacao"',
      'path="/comunicacao',
      'path="/cupons',
      'path="/analytics"',
      'path="/alertas"',
      'path="/problemas"',
      'path="/recomendacoes',
      'path="/achados-perdidos',
      'path="/ranking"',
      'path="/gamificacao"',
    ]) {
      expect(appLayout).not.toContain(pausedPath);
    }

    expect(appLayout).toContain('<Route path="*" element={<P.NotFound />} />');
  });

  it("derives mounted active surfaces from the canonical lifecycle", () => {
    expect(appLayout).toContain('isProductModuleEnabled("business")');
    for (const capability of [
      "profiles",
      "account",
      "notifications",
      "territory",
      "map",
      "nearby",
      "search",
      "messaging",
    ]) {
      expect(appLayout).toContain(
        `isPlatformCapabilityEnabled("${capability}")`,
      );
    }

    expect(appLayout).toContain('path="/empresas"');
    expect(appLayout).toContain('path="/mapa"');
    expect(appLayout).toContain('path="/perto-de-mim"');
    expect(appLayout).toContain('path="/busca"');
    expect(appLayout).toContain('path="/mensagens"');
  });

  it("keeps prefetch and idle warmup active-surface only", () => {
    for (const forbidden of [
      "@/modules/professionals",
      "@/modules/classifieds",
      "@/modules/business/gastronomy",
      "@/core/community-feed",
      "@/modules/guide",
      "APP_MODULE_SLUGS.services",
      "APP_MODULE_SLUGS.classifieds",
      "APP_MODULE_SLUGS.gastronomy",
      "APP_MODULE_SLUGS.community",
      "APP_MODULE_SLUGS.touristPoints",
    ]) {
      expect(prefetch).not.toContain(forbidden);
    }

    for (const activeOwner of [
      "@/app/pages/EmpresasLandingPage",
      "@/core/maps/pages/MapaPageV4",
      "@/core/nearby/pages/NearbyPage",
      "@/app/pages/BuscaPage",
      "@/app/pages/NotificationsPage",
    ]) {
      expect(prefetch).toContain(activeOwner);
    }
  });

  it("keeps the active lazy graph free of post-MVP owners", () => {
    for (const forbidden of [
      "createLaunchPausedRoute",
      "LaunchPausedPage",
      "@/modules/business/gastronomy",
      "@/modules/professionals",
      "@/modules/classifieds",
      "@/modules/community-",
      "@/modules/business/education",
      "@/core/mobility",
    ]) {
      expect(activeLazyImports).not.toContain(forbidden);
    }

    expect(activeLazyImports).toContain(
      'import("@/app/pages/EmpresasLandingPage")',
    );
    expect(activeLazyImports).toContain(
      'import("@/core/maps/pages/MapaPageV4")',
    );
    expect(activeLazyImports).toContain(
      'import("@/core/nearby/pages/NearbyPage")',
    );
  });

  it("keeps the territorial registry limited to Business and Map", () => {
    for (const activeId of [
      "business-detail",
      "business-category-city",
      "business-category-district",
      "business-district",
      "business-city",
      "map-district",
      "map-city",
    ]) {
      expect(routeRegistry).toContain(`id: "${activeId}"`);
    }

    for (const pausedMarker of [
      "services-",
      "classified-",
      "events-",
      "LaunchPausedPage",
      "pausedModuleName",
    ]) {
      expect(routeRegistry).not.toContain(pausedMarker);
    }

    expect(routeRegistry).toContain("isProductModuleEnabled");
    expect(routeRegistry).toContain("isPlatformCapabilityEnabled");
  });

  it("keeps active territorial wrappers free of post-MVP imports", () => {
    expect(activeTerritorialPages).toContain("CategoryBusinessPage");
    expect(activeTerritorialPages).toContain("MapaPageV4");

    for (const pausedImport of [
      "community-feed",
      "professionals",
      "classifieds",
      "community-events",
      "gastronomy",
      "education",
      "mobility",
      "VagasPublicPage",
      "createLaunchPausedRoute",
    ]) {
      expect(activeTerritorialPages).not.toContain(pausedImport);
    }
  });
});
