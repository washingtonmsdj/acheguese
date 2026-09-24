import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("MVP core module boundary", () => {
  const registry = read("src/app/config/productModuleRegistry.ts");
  const platformRegistry = read("src/app/config/platformCapabilityRegistry.ts");
  const nearbyProviderScope = read("src/app/config/nearbyProviderScope.ts");
  const searchProviderScope = read("src/app/config/searchProviderScope.ts");
  const searchProviders = read("src/core/search/providers/searchProviders.ts");
  const searchHook = read("src/core/search/hooks/useGlobalSearch.ts");
  const searchPage = read("src/app/pages/BuscaPage.tsx");
  const nearbyRouteWrapper = read("src/app/pages/NearbyPage.tsx");
  const mapLayerProviderScope = read("src/app/config/mapLayerProviderScope.ts");
  const mapRouteWrapper = read("src/app/pages/MapaPage.tsx");
  const mapProviderRegistry = read("src/core/maps/providers/registry.ts");
  const mapBusinessProvider = read(
    "src/core/maps/providers/businessMapLayerProvider.ts",
  );
  const mapRuntimeConfig = read("src/core/maps/config/runtimeConfig.ts");
  const activeTerritorialWrapper = read(
    "src/app/routes/territorial/ActiveTerritorialModulePages.tsx",
  );
  const territorialLayout = read(
    "src/core/routing/components/TerritorialLayout.tsx",
  );
  const lifecycleRegistry = read("src/app/config/lifecycleRegistry.ts");
  const launchScope = read("src/app/config/launchScope.ts");
  const presentationModules = read("src/app/config/modules.ts");
  const domainMapping = read("docs/02-domain/DOMAIN-MAPPING.md");
  const entry = read("src/app/pages/TerritoryEntryPage.tsx");
  const rootEntry = read("src/app/routes/RootRouteEntry.tsx");
  const home = read("src/app/pages/TerritoryHomePage.tsx");
  const howItWorks = read("src/app/pages/ComoFuncionaPage.tsx");
  const about = read("src/app/pages/AboutPage.tsx");
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
  const messagingRoutes = read("src/core/messaging/routes/messagingRoutes.ts");
  const rootRoutes = read("src/app/routes/AppRoutes.tsx");
  const publicMvpE2e = read("tests/e2e/territory-home-operational.spec.ts");
  const packageJson = read("package.json");
  const heavyPrWorkflow = read(".github/workflows/certify-heavy-pr-auto.yml");
  const heavyExactShaWorkflow = read(".github/workflows/certify-heavy.yml");
  const previewE2eRunner = read("tools/release/run-preview-e2e.ps1");
  const ssotWorkflow = read(".github/workflows/ssot-tests.yml");
  const e2eAuthHelper = read("tests/e2e/helpers/auth.ts");
  const fixtureAuthPasswordGrant = read(
    "tests/e2e/helpers/fixtureAuthPasswordGrant.ts",
  );
  const accountAuthenticatedE2e = read("tests/e2e/account-authenticated.spec.ts");
  const privateProfileWorkspaceAggregate = read(
    "src/core/profiles/services/profile.workspace.aggregate.ts",
  );
  const operationalEnv = read("tests/helpers/operational-env.ts");
  const supabaseRuntimeClient = read("src/integrations/supabase/supabase.ts");
  const supabaseApiKeySafeFetch = read(
    "src/integrations/supabase/apiKeySafeFetch.ts",
  );
  const onboardingVisualState = read(
    "tests/e2e/support/onboardingVisualState.ts",
  );

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
    expect(searchProviderScope).toContain('isPlatformCapabilityEnabled("search")');
    expect(searchProviderScope).toContain("isProductModuleEnabled");
    expect(searchProviders).not.toContain("@/app/config");
    expect(searchProviders).not.toContain("isLaunchSurfaceEnabled");
    expect(searchProviders).toContain("providerBuckets");
    expect(searchHook).toContain("providerBuckets");
    expect(searchPage).toContain("getActiveSearchProviderBuckets()");
    expect(searchPage).toContain("providerBuckets: activeSearchBuckets");
    expect(platformRegistry).toContain('dependsOnCapabilities: ["map", "location"]');
    expect(nearbyProviderScope).toContain('isPlatformCapabilityEnabled("nearby")');
    expect(nearbyProviderScope).toContain("isProductModuleEnabled(productModule)");
    expect(nearbyRouteWrapper).toContain("getActiveNearbyProviderIds()");
    expect(mapLayerProviderScope).toContain('isPlatformCapabilityEnabled("map")');
    expect(mapLayerProviderScope).toContain("isProductModuleEnabled(productModule)");
    expect(mapRouteWrapper).toContain("getActiveMapLayerProviderIds()");
    expect(mapRouteWrapper).toContain("loadMapLayerProvider");
    expect(mapProviderRegistry).toContain('business: {');
    expect(mapProviderRegistry).toContain('layerKey: "businesses"');
    expect(nearbyProviderScope).toContain(
      "getActiveNearbyProviderRolloutModuleKeys",
    );
    expect(activeTerritorialWrapper).toContain("[MODULE_SLUGS.map]");
    expect(activeTerritorialWrapper).toContain("[MODULE_SLUGS.nearby]");
    expect(activeTerritorialWrapper).toContain(
      "getActiveMapLayerRolloutModuleKeys()",
    );
    expect(territorialLayout).not.toContain(
      "[MODULE_SLUGS.map]: ModuleKey.BUSINESS",
    );
    expect(territorialLayout).not.toContain(
      "[MODULE_SLUGS.nearby]: ModuleKey.BUSINESS",
    );
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

    for (const activeTerritorialCapability of ["map", "nearby", "search"]) {
      const moduleBlock = presentationModules.match(
        new RegExp(`\\n  ${activeTerritorialCapability}: \\{[\\s\\S]*?\\n  \\},`),
      )?.[0] ?? "";
      expect(moduleBlock).toContain("isTerritorial: true");
    }
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

    for (const activeLabel of ["Empresas", "Mapa", "Perto de mim", "Busca"]) {
      expect(about).toContain(activeLabel);
    }
    expect(about).toContain("Outros módulos permanecem pausados");

    const normalizedAbout = about.toLowerCase();
    for (const pausedClaim of [
      "profissionais",
      "classificados",
      "gastronomia",
      "comunidade operacional",
      "vida comunitária",
    ]) {
      expect(normalizedAbout).not.toContain(pausedClaim);
    }
  });

  it("keeps the active Home limited to Business plus active horizontal capabilities", () => {
    expect(home).toContain("MODULE_SLUGS.business");
    expect(home).toContain("MODULE_SLUGS.map");
    expect(home).toContain("MODULE_SLUGS.nearby");
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

  it("keeps Map horizontal while Business is a lifecycle-scoped layer provider", () => {
    expect(map).toContain("providers = EMPTY_MAP_PROVIDERS");
    expect(map).toContain("provider.createFetcher(runtimeTerritoryFilter)");
    expect(map).not.toContain("mapBusinessLayerRuntimeService");
    expect(map).not.toContain("makeBusinessFetcher");
    expect(map).not.toContain("MODULE_SLUGS.business");
    expect(mapRouteWrapper).toContain("getActiveMapLayerProviderIds()");
    expect(mapLayerProviderScope).toContain("getActiveMapLayerRolloutModuleKeys");
    expect(mapBusinessProvider).toContain(
      "mapBusinessLayerRuntimeService.getBusinessesByBounds(bounds",
    );
    expect(mapBusinessAdapter).toContain("businessMapQueryService.getBusinessesByBounds");
    expect(mapBusinessAdapter).not.toContain("public_business_search");
    expect(mapBusinessAdapter).not.toContain("@/integrations/supabase");
    expect(businessMapQuery).toContain('from<BusinessMapRow>("public_business_search")');
    expect(mapRuntimeConfig).not.toContain("@/app/config/launchScope");
    expect(mapRuntimeConfig).not.toContain("isLaunchSurfaceEnabled");

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

  it("keeps Nearby horizontal while Business is the only active proximity provider", () => {
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

  it("mounts only lifecycle-enabled MVP surfaces in the active AppLayout", () => {
    expect(appRoutes).toContain('isProductModuleEnabled("business")');
    expect(appRoutes).toContain('isPlatformCapabilityEnabled("map")');
    expect(appRoutes).toContain('isPlatformCapabilityEnabled("nearby")');
    expect(appRoutes).toContain('isPlatformCapabilityEnabled("search")');
    expect(appRoutes).toContain('isPlatformCapabilityEnabled("messaging")');

    expect(appRoutes).toContain('path="/empresas"');
    expect(appRoutes).toContain('path="/empresas/cadastrar"');
    expect(appRoutes).toContain('path="/mapa"');
    expect(appRoutes).toContain('path="/perto-de-mim"');
    expect(appRoutes).toContain('path="/busca"');
    expect(appRoutes).toContain("messagingRoutes.inbox()");
    expect(appRoutes).toContain("messagingRoutes.threadPattern()");
    expect(messagingRoutes).toContain('inbox: () => "/mensagens"');

    expect(appRoutes).not.toContain("LaunchPausedPage");
    expect(appRoutes).not.toContain("DIRECT_PAUSED_ROUTES");
    expect(appRoutes).not.toContain("launchElement(");
    expect(appRoutes).not.toContain('path="/servicos"');
    expect(appRoutes).not.toContain('path="/classificados"');
    expect(appRoutes).not.toContain('path="/educacao"');
  });

  it("keeps paused route prefetches fail-closed before loading chunks", () => {
    const prefetch = read("src/app/routes/prefetch.ts");
    expect(prefetch).toContain(
      "if (candidate.surface && !isLaunchSurfaceEnabled(candidate.surface)) return;",
    );
    expect(prefetch).toContain('APP_MODULE_SLUGS.nearby');
    expect(prefetch).toContain('surface: "nearby"');
    expect(prefetch).toContain('import("@/app/pages/NearbyPage")');
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
    expect(publicMvpE2e).toContain("/perto-de-mim/ba/salvador/pituba");
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

  it("keeps Production authenticated smoke on explicit public Supabase configuration", () => {
    const normalizedSsotWorkflow = ssotWorkflow.replace(/\r\n/g, "\n");
    const authenticatedSmoke =
      normalizedSsotWorkflow.match(
        /\n  authenticated_account_e2e:[\s\S]*?(?=\n  [a-zA-Z0-9_-]+:\n)/,
      )?.[0] ?? "";

    expect(authenticatedSmoke).toContain("runs-on: ubuntu-latest");
    expect(authenticatedSmoke).toContain("Install Playwright browser");
    expect(authenticatedSmoke).toContain(
      "npx playwright install --with-deps chromium",
    );
    expect(authenticatedSmoke).not.toContain("runs-on: windows-latest");
    expect(ssotWorkflow).toContain(
      "E2E_SUPABASE_URL: https://xhdowzacfujckjelqhtd.supabase.co",
    );
    expect(ssotWorkflow).toContain(
      "E2E_SUPABASE_PUBLISHABLE_KEY: sb_publishable_dc-rd2YjKuZ5KJc_zRYVYA_ANmcFxKk",
    );
    expect(operationalEnv).toContain("readEnv('E2E_SUPABASE_URL')");
    expect(operationalEnv).toContain(
      "readEnv('E2E_SUPABASE_PUBLISHABLE_KEY')",
    );
    expect(supabaseRuntimeClient).toContain(
      "createSupabaseApiKeySafeFetch(",
    );
    expect(supabaseRuntimeClient).toContain(
      "PUBLIC_SUPABASE_CONFIG.publishableKey",
    );
    expect(operationalEnv).toContain(
      "createSupabaseApiKeySafeFetch(supabaseKey)",
    );
    expect(supabaseApiKeySafeFetch).toContain(
      'headers.get("Authorization") === `Bearer ${apiKey}`',
    );
    expect(supabaseApiKeySafeFetch).toContain(
      'headers.delete("Authorization")',
    );
    expect(supabaseApiKeySafeFetch).toContain(
      'apiKey.startsWith("sb_publishable_")',
    );
    expect(supabaseApiKeySafeFetch).toContain(
      'apiKey.startsWith("sb_secret_")',
    );
    expect(e2eAuthHelper).toContain(
      "Authenticated E2E requires explicit E2E_SUPABASE_URL",
    );
    expect(e2eAuthHelper).not.toContain("scriptSources");
    expect(e2eAuthHelper).not.toContain("publicBundles");
    expect(e2eAuthHelper).not.toContain(
      "Unable to discover the public Supabase browser configuration from Production.",
    );
    expect(e2eAuthHelper).toContain(
      "signInFixtureWithPasswordGrant",
    );
    expect(fixtureAuthPasswordGrant).toContain("maxAttempts = 3");
    expect(fixtureAuthPasswordGrant).toContain("isTransientStatus");
    expect(e2eAuthHelper).toContain("client.auth.setSession");
    expect(e2eAuthHelper).not.toContain("client.auth.signInWithPassword");
    expect(fixtureAuthPasswordGrant).toContain(
      '"/auth/v1/token?grant_type=password"',
    );
    expect(fixtureAuthPasswordGrant).toContain('apikey: publishableKey');
    expect(fixtureAuthPasswordGrant).toContain(
      'Accept: "application/json"',
    );
    expect(fixtureAuthPasswordGrant).not.toContain("Authorization:");
    expect(fixtureAuthPasswordGrant).toContain(
      "returned non-JSON response",
    );
    expect(packageJson).toContain(
      "tests/e2e/messaging-authenticated.spec.ts --project=chromium --reporter=list --retries=0",
    );
    expect(accountAuthenticatedE2e).toContain(
      "ensureFixtureCurrentTermsAcceptance(client)",
    );
    expect(accountAuthenticatedE2e).toContain(
      'await page.goto("/conta", { waitUntil: "domcontentloaded" })',
    );

    for (const workflow of [
      ssotWorkflow,
      heavyPrWorkflow,
      heavyExactShaWorkflow,
    ]) {
      expect(workflow).toContain(
        "group: acheguese-authenticated-e2e-fixture",
      );
      expect(workflow).toContain("cancel-in-progress: false");
    }
  });

  it("keeps heavy aggregation rerun-safe and onboarding visuals deterministic", () => {
    expect(heavyPrWorkflow).toContain(".gate-status/mvp-architecture.success");
    expect(heavyPrWorkflow).toContain(".gate-status/auth-session.success");
    expect(heavyPrWorkflow).toContain(".gate-status/regression.success");
    expect(heavyPrWorkflow).toContain(".gate-status/boundaries.success");
    expect(heavyPrWorkflow).toContain(".gate-status/public-e2e.success");
    expect(heavyPrWorkflow).not.toContain(
      "LOGOUT_OUTCOME: ${{ steps.logout_e2e.outcome }}",
    );
    expect(heavyPrWorkflow).not.toContain(
      "PUBLIC_OUTCOME: ${{ steps.public_e2e.outcome }}",
    );
    expect(heavyPrWorkflow).not.toContain("E2E_USER_EMAIL");
    expect(heavyPrWorkflow).not.toContain(
      "tests/e2e/logout-authenticated.spec.ts",
    );
    expect(heavyPrWorkflow).not.toContain(
      "tests/e2e/messaging-authenticated.spec.ts",
    );
    expect(heavyPrWorkflow).toContain(
      "tests/regression/auth/logout.test.ts",
    );
    expect(heavyPrWorkflow).toContain(
      "SessionService.initialization.spec.ts",
    );
    expect(heavyPrWorkflow).toContain("ProtectedRoute.spec.tsx");
    expect(ssotWorkflow).toContain(
      "Run authenticated Account and Business lifecycle E2E",
    );
    expect(ssotWorkflow).toContain("npm run test:e2e:account-authenticated");
    expect(heavyPrWorkflow).toContain(
      "github.event_name == 'pull_request' && github.event.pull_request.head.sha || github.sha",
    );

    expect(onboardingVisualState).toContain("ONBOARDING_LOCATION_FIXTURE");
    expect(onboardingVisualState).toContain(
      'page.route("**/rest/v1/locations*"',
    );
    expect(onboardingVisualState).toContain(
      'page.route("**/rest/v1/city_metadata*"',
    );
    expect(onboardingVisualState).toContain('"Acupe"');
    expect(onboardingVisualState).toContain('"Alto das Pombas"');
  });

  it("keeps Account workspace independent from paused product domains", () => {
    expect(privateProfileWorkspaceAggregate).toContain(
      "optionalWorkspaceRead",
    );
    expect(privateProfileWorkspaceAggregate).toContain(
      "Paused domains never participate in the Account critical path.",
    );
    expect(privateProfileWorkspaceAggregate).not.toContain(
      'professional/services/professional.queries',
    );
    expect(privateProfileWorkspaceAggregate).not.toContain(
      'classifieds/services',
    );
    expect(privateProfileWorkspaceAggregate).not.toContain(
      'billing/services/EntitlementResolver',
    );
    expect(privateProfileWorkspaceAggregate).not.toContain(
      'from("gastronomy_profiles")',
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
