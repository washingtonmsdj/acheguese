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
    expect(pageSource).toContain("useSpatialSearchHybrid");
    expect(pageSource).toContain("locationIds: moduleTerritory.resolvedLocationIds");
    expect(pageSource).toContain("normalizeRealBusinessEntry");
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

  it("keeps the territorial landing URL-first through module territory resolution", () => {
    const landingSource = readProjectFile(
      "src/core/routing/components/TerritorialLandingPage.tsx",
    );

    expect(landingSource).toContain("useModuleTerritoryFilter(");
    expect(landingSource).toContain("routeResolved: resolved");
    expect(landingSource).toContain("activeMemberIds");
    expect(landingSource).toContain("const filter = moduleTerritory.territoryFilter");
    expect(landingSource).not.toContain("useTerritoryFilter(");
  });

  it("keeps events and community surfaces anchored to module territory at the page boundary", () => {
    const eventsSource = readProjectFile("src/core/community/pages/EventosPage.tsx");
    const communitySource = readProjectFile("src/core/community/pages/ComunidadePage.tsx");

    expect(eventsSource).toContain("useModuleTerritoryFilter(");
    expect(eventsSource).toContain("routeResolved: resolved");
    expect(eventsSource).toContain("activeMemberIds");
    expect(eventsSource).toContain("const territoryFilter = moduleTerritory.territoryFilter");
    expect(eventsSource).not.toContain("useTerritoryFilter(");

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
    expect(mapSource).not.toContain("useTerritoryFilter(effectiveResolved, activeMemberIds)");
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
    const territorialModulesSource = readProjectFile(
      "src/app/routes/territorial/TerritorialModulePages.tsx",
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
    expect(territorialModulesSource).toContain(
      "<VagasPage resolved={resolved} activeMemberIds={activeMemberIds} />",
    );
    expect(territorialModulesSource).toContain(
      "<ComunidadePage resolved={resolved} activeMemberIds={activeMemberIds} />",
    );
  });

});
