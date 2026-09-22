import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("MVP core module boundary", () => {
  const registry = read("src/app/config/productModuleRegistry.ts");
  const platformRegistry = read("src/app/config/platformCapabilityRegistry.ts");
  const lifecycleRegistry = read("src/app/config/lifecycleRegistry.ts");
  const launchScope = read("src/app/config/launchScope.ts");
  const domainMapping = read("docs/02-domain/DOMAIN-MAPPING.md");
  const entry = read("src/app/pages/TerritoryEntryPage.tsx");
  const rootEntry = read("src/app/routes/RootRouteEntry.tsx");
  const home = read("src/app/pages/TerritoryHomePage.tsx");
  const howItWorks = read("src/app/pages/ComoFuncionaPage.tsx");
  const businessDetail = read("src/app/pages/EmpresaDetailLandingPage.tsx");
  const businessCtas = read("src/modules/business/company/sections/EmpresaCTAsSection.tsx");
  const businessSections = read("src/modules/business/company/sections/index.ts");
  const businessSectionTypes = read("src/modules/business/company/sections/types.ts");
  const branchNetwork = read("src/core/business/components/BranchNetworkBlock.tsx");
  const businessIndex = read("src/core/business/index.ts");
  const businessMapQuery = read("src/core/business/services/BusinessMapQueryService.ts");
  const mapBusinessAdapter = read("src/core/maps/services/MapBusinessLayerRuntimeService.ts");
  const map = read("src/core/maps/pages/MapaPageV4.tsx");
  const nearby = read("src/core/nearby/pages/NearbyPage.tsx");
  const sidebar = read("src/app/components/navigation/AppSidebar.tsx");
  const territoryNavigation = read(
    "src/core/navigation/territoryNavigationModes.ts",
  );
  const appRoutes = read("src/app/routes/sections/AppLayoutRoutes.tsx");
  const rootRoutes = read("src/app/routes/AppRoutes.tsx");
  const publicMvpE2e = read("tests/e2e/territory-home-operational.spec.ts");
  const packageJson = read("package.json");
  const heavyPrWorkflow = read(".github/workflows/certify-heavy-pr-auto.yml");
  const heavyExactShaWorkflow = read(".github/workflows/certify-heavy.yml");
  const previewE2eRunner = read("tools/release/run-preview-e2e.ps1");

  it("keeps domain modules separate from horizontal platform capabilities", () => {
    expect(registry).toContain('business: { status: "active" }');
    expect(registry).not.toContain('| "search"');
    expect(registry).not.toContain('| "messaging"');
    expect(registry).not.toContain('| "map"');
    expect(registry).not.toContain('| "nearby"');
    expect(registry).toContain('community: { status: "paused" }');
    expect(registry).toContain('classifieds: { status: "paused" }');

    expect(platformRegistry).toContain('| "map"');
    expect(platformRegistry).toContain('| "nearby"');
    expect(platformRegistry).toContain('| "search"');
    expect(platformRegistry).toContain('| "messaging"');
    expect(platformRegistry).toContain('dependsOnProductModules: ["business"]');
    expect(lifecycleRegistry).toContain("isProductModuleEnabled");
    expect(lifecycleRegistry).toContain("isPlatformCapabilityEnabled");

    expect(launchScope).toContain(
      'business: isProductModuleEnabled("business")',
    );
    expect(launchScope).toContain(
      'map: isPlatformCapabilityEnabled("map")',
    );
    expect(launchScope).toContain(
      'nearby: isPlatformCapabilityEnabled("nearby")',
    );
    expect(launchScope).toContain(
      'search: isPlatformCapabilityEnabled("search")',
    );
  });

  it("keeps living Territory docs aligned with the domain/capability lifecycle split", () => {
    expect(domainMapping).toContain(
      "**Business/Empresas** é o único domínio de produto ativo",
    );
    expect(domainMapping).toContain("platformCapabilityRegistry.ts");
    expect(domainMapping).toContain("lifecycleRegistry.ts");
    expect(domainMapping).toContain("Capability horizontal Map");
    expect(domainMapping).toContain("Capability horizontal Nearby");
    expect(domainMapping).not.toContain("como módulos de produto ativos");
    expect(domainMapping).not.toContain("Módulo Map");
    expect(domainMapping).not.toContain("Módulo Nearby");
    expect(domainMapping).not.toContain("capability Community/Feed");
    expect(rootEntry).toContain("Business/Empresas como domínio ativo");
    expect(rootEntry).toContain("capabilities horizontais");
    expect(rootEntry).not.toContain("três módulos ativos do produto");
  });

  it("keeps the public entry pointed only at the MVP core", () => {
    expect(entry).toContain("launchBusinessUrl");
    expect(entry).toContain("launchMapUrl");
    expect(entry).toContain("launchNearbyUrl");
    expect(entry).toContain("launchSearchUrl");
    expect(entry).not.toContain("LAUNCH_URLS.community");
    expect(entry).not.toContain("/indicar-comunidade");
    expect(entry).not.toContain("serviços e histórias");
    expect(entry).toContain("buildLoginPath(ACCOUNT_PATH)");
  });

  it("keeps institutional product copy aligned with Business plus active platform capabilities", () => {
    expect(howItWorks).toContain('title: "Empresas"');
    expect(howItWorks).toContain('title: "Mapa"');
    expect(howItWorks).toContain('title: "Perto de mim"');
    expect(howItWorks).toContain('title: "Busca"');

    for (const paused of [
      "LAUNCH_URLS.community",
      "LAUNCH_URLS.services",
      "LAUNCH_URLS.gastronomy",
      "LAUNCH_URLS.classifieds",
      "/indicar-comunidade",
      "Perfil profissional",
    ]) {
      expect(howItWorks).not.toContain(paused);
    }
  });

  it("keeps the active Home limited to Business plus active horizontal capabilities", () => {
    expect(home).toContain("MODULE_SLUGS.business");
    expect(home).toContain("MODULE_SLUGS.map");
    expect(home).toContain("APP_MODULE_SLUGS.nearby");
    expect(home).toContain("MODULE_SLUGS.search");

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

  it("keeps Business independent from paused vertical and community modules", () => {
    for (const forbidden of [
      "@/modules/business/gastronomy/",
      "GastronomyDetailPage",
      "EmpresaGastronomiaPreviewSection",
      "communityAliasOverride",
      "verticalPublicUrls",
      "gastronomyUrl",
    ]) {
      expect(businessDetail).not.toContain(forbidden);
    }

    expect(businessCtas).not.toContain("@/core/verticals");
    expect(businessCtas).not.toContain("Experiencias especializadas");
    expect(branchNetwork).not.toContain("getCommunityScopedUrl");
    expect(branchNetwork).not.toContain("communityAliasOverride");
    expect(businessSections).not.toContain("EmpresaAvaliacoesSection");
    expect(businessSectionTypes).not.toContain("EmpresaAvaliacoesSectionProps");
    expect(businessSectionTypes).not.toContain("ReviewCardProps");
    expect(businessSectionTypes).not.toContain("RatingDistributionProps");
    expect(businessIndex).not.toContain("hasGastronomyProfile");
    expect(businessIndex).not.toContain("gastronomy.queries");
  });

  it("keeps Map independent from paused product owners", () => {
    expect(map).toContain("mapBusinessLayerRuntimeService");
    expect(map).toContain("makeBusinessFetcher");
    expect(mapBusinessAdapter).toContain("businessMapQueryService.getBusinessesByBounds");
    expect(mapBusinessAdapter).not.toContain("public_business_search");
    expect(mapBusinessAdapter).not.toContain("@/integrations/supabase");
    expect(businessMapQuery).toContain('from<BusinessMapRow>("public_business_search")');

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

  it("keeps post-MVP premium and social surfaces out of the public route tree", () => {
    expect(rootRoutes).not.toContain('path="/empresas/:id/catalogo"');
    expect(rootRoutes).not.toContain('path="/p/:slug/*"');
    expect(rootRoutes).not.toContain("PremiumBusinessCheckoutPage");
    expect(appRoutes).toContain('path="/u/:username"');
    expect(appRoutes).toContain('"profiles"');
    expect(appRoutes).toContain("<P.ProfilePublicRoute />");
    expect(appRoutes).not.toContain(
      '"community",\n            "Perfis públicos"',
    );
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
    expect(appRoutes).toContain('launchElement("search", "Busca"');
    expect(appRoutes).toContain('path="/empresas/cadastrar"');
    expect(appRoutes).toContain('"business"');
    expect(appRoutes).toContain(
      "protectedElement(<P.EmpresasCadastroLandingPage />)",
    );
  });

  it("keeps paused route prefetches fail-closed before loading chunks", () => {
    const prefetch = read("src/app/routes/prefetch.ts");
    expect(prefetch).toContain(
      "if (candidate.surface && !isLaunchSurfaceEnabled(candidate.surface)) return;",
    );
    expect(prefetch).toContain('APP_MODULE_SLUGS.nearby');
    expect(prefetch).toContain('surface: "nearby"');
    expect(prefetch).toContain('import("@/core/nearby/pages/NearbyPage")');
    expect(prefetch).toContain("IDLE_WARMUP_ROUTES.filter(");
    expect(prefetch).toContain(
      "(entry) => !entry.surface || isLaunchSurfaceEnabled(entry.surface)",
    );
  });

  it("keeps primary territorial navigation on the MVP core", () => {
    for (const id of ['"home"', '"map"', '"business"', '"nearby"', '"search"', '"account"']) {
      expect(territoryNavigation).toContain(`id: ${id}`);
    }

    expect(territoryNavigation).not.toContain('id: "community"');
    expect(territoryNavigation).not.toContain('id: "explore"');
    expect(territoryNavigation).not.toContain('id: "activity"');
  });

  it("keeps release E2E aligned with the active MVP lifecycle instead of the retired community-first contract", () => {
    expect(publicMvpE2e).toContain("/empresas/ba/salvador/pituba");
    expect(publicMvpE2e).toContain("/mapa/ba/salvador/pituba");
    expect(publicMvpE2e).toContain("/perto-de-mim");
    expect(publicMvpE2e).toContain("/busca/ba/salvador/pituba");
    expect(publicMvpE2e).toContain("HOME_BUSINESS");
    expect(publicMvpE2e).toContain("430m");

    for (const stale of [
      "Explorar o Complexo do Nordeste de Amaralina",
      "Community ainda não liberada",
      'name: "Explorar"',
      'name: "Comunidade"',
      'data-bottom-nav-item="comunidade"',
    ]) {
      expect(publicMvpE2e).not.toContain(stale);
    }

    expect(packageJson).toContain('"test:mvp:architecture"');
    expect(packageJson).toContain('"test:e2e:mvp"');
    expect(packageJson).toContain("tests/e2e/launch-scope-public.spec.ts");
  });

  it("keeps automatic heavy E2E on the canonical preview runner", () => {
    expect(previewE2eRunner).toContain("param(");
    expect(previewE2eRunner).toContain("[string[]]$PlaywrightArgs");
    expect(heavyPrWorkflow).toContain(
      ".\\tools\\release\\run-preview-e2e.ps1",
    );
    expect(heavyPrWorkflow).toContain("push:");
    expect(heavyPrWorkflow).toContain("- main");
    expect(heavyPrWorkflow).toContain("github.event_name == 'push'");
    expect(heavyPrWorkflow).toContain("github.sha");
    expect(heavyPrWorkflow).toContain(
      "github.event.pull_request.number || github.sha",
    );
    expect(heavyPrWorkflow).not.toContain(
      ".\\scripts\\ci\\run-preview-e2e.ps1",
    );
  });

  it("keeps exact-SHA release certification focused on the active MVP while preserving global quality gates", () => {
    expect(heavyExactShaWorkflow).toContain('npm run test:e2e:mvp');
    expect(heavyExactShaWorkflow).toContain('@("run", "test:mvp:architecture")');
    expect(heavyExactShaWorkflow).toContain('& npm run test');
    expect(heavyExactShaWorkflow).toContain('@("run", "lint")');
    expect(heavyExactShaWorkflow).toContain('@("run", "typecheck")');
    expect(heavyExactShaWorkflow).toContain('@("run", "security:validate")');

    expect(heavyExactShaWorkflow).not.toContain(
      "validate-education-module-boundaries.ts",
    );
    expect(heavyExactShaWorkflow).not.toContain(
      "validate-gastronomy-module-boundaries.ts",
    );
    expect(heavyExactShaWorkflow).not.toContain(
      "eslint-rules/configs/billing-rules.config.js",
    );
    expect(heavyExactShaWorkflow).not.toContain(
      "src/core/billing/__tests__/contracts/",
    );
  });
});
