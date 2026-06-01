import { describe, expect, it } from "vitest";

import { APP_MODULE_SLUGS } from "@/config/moduleSlugs";
import {
  REQUIRED_CITY_TERRITORIAL_MODULES,
  TERRITORIAL_ROUTE_PARAMS,
  TERRITORIAL_ROUTE_STATIC_SEGMENTS,
  buildCommunityAliasRoutePath,
  buildCommunityRootAliasRoutePath,
  buildCommunityTerritoryRoutePath,
  buildTerritorialBareRoutePath,
  buildTerritorialModuleRoutePath,
  buildTerritorialRoutePath,
} from "../territorialRoutePatterns";

describe("territorial route patterns", () => {
  it("builds the mandatory /module/state/city route", () => {
    expect(buildTerritorialModuleRoutePath(APP_MODULE_SLUGS.events)).toBe(
      "/eventos/:state/:city",
    );
    expect(buildTerritorialModuleRoutePath(APP_MODULE_SLUGS.business)).toBe(
      "/empresas/:state/:city",
    );
  });

  it("builds district and module suffix routes from shared params", () => {
    expect(
      buildTerritorialModuleRoutePath(APP_MODULE_SLUGS.business, [
        TERRITORIAL_ROUTE_PARAMS.district,
        TERRITORIAL_ROUTE_STATIC_SEGMENTS.category,
        TERRITORIAL_ROUTE_PARAMS.category,
      ]),
    ).toBe("/empresas/:state/:city/:district/categoria/:category");
  });

  it("keeps bare and community territorial paths canonical", () => {
    expect(buildTerritorialBareRoutePath()).toBe("/:state/:city");
    expect(
      buildCommunityTerritoryRoutePath([TERRITORIAL_ROUTE_PARAMS.slug]),
    ).toBe("/comunidade/:state/:city/:slug");
    expect(buildCommunityAliasRoutePath()).toBe("/comunidade/:communitySlug");
    expect(buildCommunityRootAliasRoutePath()).toBe("/:communitySlug");
    expect(
      buildCommunityRootAliasRoutePath([APP_MODULE_SLUGS.business]),
    ).toBe("/:communitySlug/empresas");
  });

  it("builds non-module territorial aliases from shared params", () => {
    expect(
      buildTerritorialRoutePath(TERRITORIAL_ROUTE_STATIC_SEGMENTS.searchAlias),
    ).toBe("/buscar/:state/:city");
    expect(
      buildTerritorialRoutePath(
        TERRITORIAL_ROUTE_STATIC_SEGMENTS.communication,
        [TERRITORIAL_ROUTE_PARAMS.channelSlug],
      ),
    ).toBe("/comunicacao/:state/:city/:channelSlug");
  });

  it("centralizes event child route segments for canonical aliases", () => {
    expect(TERRITORIAL_ROUTE_PARAMS.eventId).toBe(":eventId");
    expect(TERRITORIAL_ROUTE_STATIC_SEGMENTS.favorites).toBe("favoritos");
    expect(TERRITORIAL_ROUTE_STATIC_SEGMENTS.calendar).toBe("calendario");
    expect(TERRITORIAL_ROUTE_STATIC_SEGMENTS.map).toBe("mapa");
    expect(TERRITORIAL_ROUTE_STATIC_SEGMENTS.eventDetail).toBe("evento");
    expect(TERRITORIAL_ROUTE_STATIC_SEGMENTS.professional).toBe("profissional");
  });

  it("tracks every public city module that must expose /module/state/city", () => {
    expect(REQUIRED_CITY_TERRITORIAL_MODULES).toEqual([
      "empresas",
      "servicos",
      "classificados",
      "eventos",
      "vagas",
      "gastronomia",
      "educacao",
      "mapa",
      "pontos-turisticos",
    ]);
  });
});
