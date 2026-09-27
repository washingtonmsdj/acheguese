import type { AppModuleSlug } from "@/shared/config/moduleSlugs";
import { APP_MODULE_SLUGS } from "@/shared/config/moduleSlugs";

export const TERRITORIAL_ROUTE_PARAMS = {
  state: ":state",
  city: ":city",
  district: ":district",
  territorySlug: ":territorySlug",
  groupSlugOrDistrict: ":groupSlugOrDistrict",
  slug: ":slug",
  eventId: ":eventId",
  id: ":id",
  category: ":category",
  subcategory: ":subcategory",
  channelSlug: ":channelSlug",
} as const;

export const TERRITORIAL_ROUTE_STATIC_SEGMENTS = {
  calendar: "calendario",
  category: "categoria",
  communication: "comunicacao",
  eventDetail: "evento",
  favorites: "favoritos",
  feed: "feed",
  gastronomyPremium: "gastronomia-premium",
  groups: "grupos",
  interest: "interesse",
  issues: "problemas",
  lostAndFound: "achados-e-perdidos",
  map: "mapa",
  professional: "profissional",
  publish: "publicar",
  searchAlias: "buscar",
} as const;

export const REQUIRED_CITY_TERRITORIAL_MODULES = [
  APP_MODULE_SLUGS.business,
  APP_MODULE_SLUGS.services,
  APP_MODULE_SLUGS.classifieds,
  APP_MODULE_SLUGS.events,
  APP_MODULE_SLUGS.jobs,
  APP_MODULE_SLUGS.gastronomy,
  APP_MODULE_SLUGS.map,
  APP_MODULE_SLUGS.nearby,
  APP_MODULE_SLUGS.touristPoints,
] as const satisfies readonly AppModuleSlug[];

function joinRoutePath(segments: readonly string[]): string {
  return `/${segments.filter(Boolean).join("/")}`;
}

/**
 * Canonical territorial hierarchy:
 *   /:state/:city
 *   /:state/:city/:district
 *   /:state/:city/:module
 *   /:state/:city/:district/:module
 */
export function buildTerritorialBareRoutePath(
  suffixSegments: readonly string[] = [],
): string {
  return joinRoutePath([
    TERRITORIAL_ROUTE_PARAMS.state,
    TERRITORIAL_ROUTE_PARAMS.city,
    ...suffixSegments,
  ]);
}

export function buildTerritorialRoutePath(
  segment: string,
  suffixSegments: readonly string[] = [],
): string {
  return buildTerritorialBareRoutePath([segment, ...suffixSegments]);
}

export function buildScopedTerritorialRoutePath(
  segment: string,
  suffixSegments: readonly string[] = [],
): string {
  return buildTerritorialBareRoutePath([
    TERRITORIAL_ROUTE_PARAMS.district,
    segment,
    ...suffixSegments,
  ]);
}

export function buildTerritorialModuleRoutePath(
  module: AppModuleSlug,
  suffixSegments: readonly string[] = [],
): string {
  return buildTerritorialRoutePath(module, suffixSegments);
}

export function buildScopedTerritorialModuleRoutePath(
  module: AppModuleSlug,
  suffixSegments: readonly string[] = [],
): string {
  return buildScopedTerritorialRoutePath(module, suffixSegments);
}

export function buildCommunityTerritoryRoutePath(
  suffixSegments: readonly string[] = [],
): string {
  return buildTerritorialModuleRoutePath(
    APP_MODULE_SLUGS.community,
    suffixSegments,
  );
}
