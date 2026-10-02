import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const currentDir = resolve(fileURLToPath(import.meta.url), "..");
const repoRoot = resolve(currentDir, "../../../..");

function readProjectFile(path: string): string {
  return readFileSync(resolve(repoRoot, path), "utf8");
}

describe("public territorial surface audit", () => {
  it("keeps businesses gated by the resolved territory and canonical public data", () => {
    const pageSource = readProjectFile("src/app/pages/EmpresasLandingPage.tsx");
    const listHookSource = readProjectFile("src/core/business/hooks/useBusinessList.ts");
    const accountSource = readProjectFile("src/modules/profile/pages/ContaHubPage.tsx");

    expect(pageSource).toContain("territoryFilter: moduleTerritory.territoryFilter");
    expect(pageSource).not.toContain("useSpatialSearchHybrid");
    expect(pageSource).not.toContain("useRobustGeolocation");
    expect(pageSource).toContain("locationIds: moduleTerritory.resolvedLocationIds");
    expect(pageSource).toContain("normalizeRealBusinessEntry");
    expect(pageSource).not.toContain("isLaunchBusinessCategoryEnabled");
    expect(pageSource).toContain(
      "realBusinesses.map(normalizeRealBusinessEntry)",
    );
    expect(pageSource).not.toContain("normalizeNearbyBusiness");
    expect(listHookSource).toContain("enabled: enabled && filterReady");
    expect(accountSource).toContain("navigate(data.appUrls.profile.businesses)");
  });

  it("keeps services landing URL-first through module territory injection", () => {
    const pageSource = readProjectFile(
      "src/modules/professionals/services/pages/ServicosLandingPage.tsx",
    );
    const servicesHookSource = readProjectFile(
      "src/modules/professionals/services/hooks/useServicos.ts",
    );
    const topRatedHookSource = readProjectFile(
      "src/modules/professionals/services/hooks/useTopRatedProfessionals.ts",
    );

    expect(pageSource).toContain("useModuleTerritoryFilter(");
    expect(pageSource).toContain("routeResolved");
    expect(pageSource).toContain("territoryFilter: moduleTerritory.territoryFilter");
    expect(pageSource).toContain("activeMemberIds: routeActiveMemberIds");
    expect(pageSource).not.toContain("useTerritoryFilter(");

    expect(servicesHookSource).toContain("territoryFilter?: TerritoryFilter");
    expect(servicesHookSource).toContain("const routeFilter = useTerritoryFilter");
    expect(servicesHookSource).toContain(
      "const effectiveTerritoryFilter = territoryFilter ?? routeFilter",
    );

    expect(topRatedHookSource).toContain("territoryFilter?: TerritoryFilter");
    expect(topRatedHookSource).toContain("const routeFilter = useTerritoryFilter");
    expect(topRatedHookSource).toContain(
      "const effectiveTerritoryFilter = territoryFilter ?? routeFilter",
    );
  });

  it("keeps tourist points surfaces URL-first through module territory resolution", () => {
    const listingSource = readProjectFile("src/modules/guide/pages/TouristPointsPage.tsx");
    const detailSource = readProjectFile("src/modules/guide/pages/TouristPointDetailPage.tsx");

    expect(listingSource).toContain("useModuleTerritoryFilter(");
    expect(listingSource).toContain("routeResolved: resolved");
    expect(listingSource).toContain("const filter = moduleTerritory.territoryFilter");
    expect(listingSource).not.toContain("useTerritoryFilter(");

    expect(detailSource).toContain("useModuleTerritoryFilter(");
    expect(detailSource).toContain("routeResolved: resolved");
    expect(detailSource).toContain("const territoryFilter = moduleTerritory.territoryFilter");
    expect(detailSource).not.toContain("useTerritoryFilter(");
  });

  it("keeps the canonical territorial home limited to active MVP surfaces", () => {
    const homeSource = readProjectFile("src/app/pages/TerritoryHomePage.tsx");

    for (const activeSlug of ["business", "map", "nearby", "search"]) {
      expect(homeSource).toContain(`MODULE_SLUGS.${activeSlug}`);
    }

    for (const pausedSlug of ["services", "gastronomy", "classifieds", "community"]) {
      expect(homeSource).not.toContain(`MODULE_SLUGS.${pausedSlug}`);
    }

    expect(homeSource).not.toContain("useLandingFeatured");
    expect(homeSource).not.toContain("useCommunityProfile");
  });

  it("keeps events and community surfaces anchored to module territory at the page boundary", () => {
    const eventsSource = readProjectFile(
      "src/modules/community-events/pages/EventsListPage.tsx",
    );
    const eventTerritorySource = readProjectFile(
      "src/modules/community-events/hooks/useEventTerritoryFilter.ts",
    );
    const communitySource = readProjectFile(
      "src/core/community-feed/pages/ComunidadePage.tsx",
    );

    expect(eventsSource).toContain(
      "useEventTerritoryFilter(resolved, activeMemberIds)",
    );
    expect(eventTerritorySource).toContain("useModuleTerritoryFilter({");
    expect(eventTerritorySource).toContain("routeResolved: resolved");
    expect(eventTerritorySource).toContain("activeMemberIds");
    expect(eventTerritorySource).toContain("includeDescendants: false");
    expect(eventTerritorySource).not.toContain("useTerritoryFilter(");

    expect(communitySource).toContain("useModuleTerritoryFilter(");
    expect(communitySource).toContain("routeResolved: resolved");
    expect(communitySource).toContain("activeMemberIds");
    expect(communitySource).toContain("const territoryFilter = moduleTerritory.territoryFilter");
    expect(communitySource).not.toContain("useTerritoryFilter(resolved)");
  });

  it("keeps the map on module territory but isolates focus-target mode from artificial territorial filters", () => {
    const mapSource = readProjectFile("src/core/maps/pages/MapaPageV4.tsx");

    expect(mapSource).toContain("useModuleTerritoryFilter(");
    expect(mapSource).toContain("routeResolved: effectiveResolved");
    expect(mapSource).toContain("activeMemberIds");
    expect(mapSource).toContain("const isFocusOnlyMode = Boolean(focusTarget) && !effectiveResolved");
    expect(mapSource).toContain("const runtimeTerritoryFilter = isFocusOnlyMode ? undefined : territoryFilter");
    expect(mapSource).toContain("buildPublicTerritoryBaseUrlFromInput(");
    expect(mapSource).not.toContain("useTerritoryFilter(effectiveResolved, activeMemberIds)");
    expect(mapSource).not.toContain("buildGroupBaseUrl(resolved.group, `/${country}/${state}/${city}`)");
  });

  it("keeps gastronomy and classifieds group routes scoped to active module members", () => {
    const gastronomySource = readProjectFile(
      "src/modules/business/gastronomy/pages/GastronomyLandingPage.tsx",
    );
    const classifiedsSource = readProjectFile("src/core/classifieds/hooks/useClassificados.ts");
    const sellersSource = readProjectFile("src/modules/classifieds/hooks/useVendedores.ts");
    const jobsSource = readProjectFile("src/modules/classifieds/jobs/hooks/useVagas.ts");
    const jobsPublicSource = readProjectFile(
      "src/modules/classifieds/jobs/pages/VagasPublicPage.tsx",
    );

    expect(gastronomySource).toContain("const activeMemberIds = territorialContext?.activeMemberIds");
    expect(gastronomySource).toContain("useModuleTerritoryFilter({ routeResolved: resolved, activeMemberIds })");

    expect(classifiedsSource).toContain("const { filters, routeResolved, activeMemberIds } = options");
    expect(classifiedsSource).toContain("activeMemberIds");
    expect(sellersSource).toContain("const { routeResolved, activeMemberIds, search } = options");
    expect(sellersSource).toContain("useModuleTerritoryFilter({ routeResolved, activeMemberIds })");
    expect(jobsSource).toContain("const { resolved, activeMemberIds } = params");
    expect(jobsSource).toContain("useModuleTerritoryFilter({ routeResolved: resolved, activeMemberIds })");
    expect(jobsPublicSource).toContain("activeMemberIds?: string[]");
    expect(jobsPublicSource).toContain(
      "useModuleTerritoryFilter({ routeResolved: resolved, activeMemberIds })",
    );
  });

  it("keeps launch territory copy and indication paths projected from canonical SSOT", () => {
    const entrySource = readProjectFile("src/app/pages/TerritoryEntryPage.tsx");
    const guideSource = readProjectFile("src/app/pages/ComoFuncionaPage.tsx");
    const indicationSource = readProjectFile("src/app/pages/CommunityIndicationPage.tsx");
    const searchSource = readProjectFile("src/app/pages/BuscaPage.tsx");
    const businessDetailSource = readProjectFile("src/app/pages/EmpresaDetailLandingPage.tsx");

    expect(entrySource).toContain("TERRITORY_CONFIG");
    expect(entrySource).toContain("LAUNCH_COMMUNITY_NAME");
    expect(entrySource).not.toContain("Complexo do Nordeste de Amaralina");

    expect(guideSource).toContain("TERRITORY_CONFIG.launch.community.name");
    expect(guideSource).toContain("getStateByCode(TERRITORY_CONFIG.launch.state)");
    expect(guideSource).not.toContain('|| "Salvador"');
    expect(guideSource).not.toContain('|| "Complexo do Nordeste de Amaralina"');

    expect(indicationSource).toContain("BRAZILIAN_STATES.map");
    expect(indicationSource).toContain("buildPublicTerritoryBaseUrlFromInput(");
    expect(indicationSource).toContain("addCountryPrefix(");
    expect(indicationSource).toContain("communitySlug: normalizedNeighborhood");
    expect(indicationSource).toContain("to={LAUNCH_URLS.portal}");
    expect(indicationSource).not.toContain("to={LAUNCH_URLS.community}");
    expect(indicationSource).not.toContain("territoryPath: `/ba/");
    expect(indicationSource).not.toContain("Complexo do Nordeste de Amaralina");

    expect(searchSource).toContain("buildPublicTerritoryBaseUrlFromInput(");
    expect(searchSource).not.toContain("const territoryBase = `/${stateSlug}");

    expect(businessDetailSource).toContain("LAUNCH_URLS.portal");
    expect(businessDetailSource).toContain("buildPublicTerritoryBaseUrlFromInput(");
    expect(businessDetailSource).toContain("buildModuleTerritoryUrl(");
    expect(businessDetailSource).not.toContain('state || "ba"');
    expect(businessDetailSource).not.toContain('city || "salvador"');
    expect(businessDetailSource).not.toContain("complexo-do-nordeste-de-amaralina");
    expect(businessDetailSource).not.toContain("${territoryUrl}/empresas");
  });

});
