import { describe, expect, it } from "vitest";

import { isLaunchSurfaceEnabled } from "@/app/config/launchScope";
import { APP_MODULE_SLUGS } from "@/shared/config/moduleSlugs";
import {
  REQUIRED_CITY_TERRITORIAL_MODULES,
  TERRITORIAL_ROUTE_PARAMS,
  TERRITORIAL_ROUTE_STATIC_SEGMENTS,
  buildCommunityTerritoryRoutePath,
  buildScopedTerritorialModuleRoutePath,
  buildTerritorialBareRoutePath,
  buildTerritorialModuleRoutePath,
  buildTerritorialRoutePath,
} from "../territorialRoutePatterns";

describe("territorial route patterns", () => {
  it("builds canonical territory-first city module routes", () => {
    expect(buildTerritorialModuleRoutePath(APP_MODULE_SLUGS.events)).toBe(
      "/:state/:city/eventos",
    );
    expect(buildTerritorialModuleRoutePath(APP_MODULE_SLUGS.business)).toBe(
      "/:state/:city/empresas",
    );
    expect(buildTerritorialModuleRoutePath(APP_MODULE_SLUGS.nearby)).toBe(
      "/:state/:city/perto-de-mim",
    );
  });

  it("builds scoped territory module routes with the module after the territory", () => {
    expect(
      buildScopedTerritorialModuleRoutePath(APP_MODULE_SLUGS.business, [
        TERRITORIAL_ROUTE_STATIC_SEGMENTS.category,
        TERRITORIAL_ROUTE_PARAMS.category,
      ]),
    ).toBe("/:state/:city/:territorySlug/empresas/categoria/:category");
  });

  it("keeps bare and community territorial paths canonical", () => {
    expect(buildTerritorialBareRoutePath()).toBe("/:state/:city");
    expect(
      buildScopedTerritorialModuleRoutePath(APP_MODULE_SLUGS.community),
    ).toBe("/:state/:city/:territorySlug/comunidade");
    expect(
      buildCommunityTerritoryRoutePath([TERRITORIAL_ROUTE_PARAMS.slug]),
    ).toBe("/:state/:city/comunidade/:slug");
  });

  it("builds non-module territorial aliases after the territory", () => {
    expect(
      buildTerritorialRoutePath(TERRITORIAL_ROUTE_STATIC_SEGMENTS.searchAlias),
    ).toBe("/:state/:city/buscar");
    expect(
      buildTerritorialRoutePath(
        TERRITORIAL_ROUTE_STATIC_SEGMENTS.communication,
        [TERRITORIAL_ROUTE_PARAMS.channelSlug],
      ),
    ).toBe("/:state/:city/comunicacao/:channelSlug");
  });

  it("centralizes event child route segments for canonical aliases", () => {
    expect(TERRITORIAL_ROUTE_PARAMS.eventId).toBe(":eventId");
    expect(TERRITORIAL_ROUTE_STATIC_SEGMENTS.favorites).toBe("favoritos");
    expect(TERRITORIAL_ROUTE_STATIC_SEGMENTS.calendar).toBe("calendario");
    expect(TERRITORIAL_ROUTE_STATIC_SEGMENTS.map).toBe("mapa");
    expect(TERRITORIAL_ROUTE_STATIC_SEGMENTS.eventDetail).toBe("evento");
    expect(TERRITORIAL_ROUTE_STATIC_SEGMENTS.professional).toBe("profissional");
  });

  it("tracks every public city module that must expose territory-first routes", () => {
    expect(REQUIRED_CITY_TERRITORIAL_MODULES).toEqual([
      "empresas",
      "servicos",
      "classificados",
      "eventos",
      "vagas",
      "gastronomia",
      "mapa",
      "perto-de-mim",
      "pontos-turisticos",
    ]);
  });

  it("keeps paused education out of the required public city registry", () => {
    expect(isLaunchSurfaceEnabled("education")).toBe(false);
    expect(REQUIRED_CITY_TERRITORIAL_MODULES).not.toContain(
      APP_MODULE_SLUGS.education,
    );
  });
});
