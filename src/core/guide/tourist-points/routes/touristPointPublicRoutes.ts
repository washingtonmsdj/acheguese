import { APP_MODULE_SLUGS, buildAppModulePath } from "@/shared/config/moduleSlugs";
import {
  TERRITORIAL_ROUTE_PARAMS,
  buildScopedTerritorialModuleRoutePath,
  buildTerritorialModuleRoutePath,
} from "@/core/routing/config/territorialRoutePatterns";
import {
  buildModuleTerritoryUrl,
  normalizePublicTerritoryPath,
} from "@/core/routing/utils/territoryUrls";

export interface TouristPointTerritoryRouteInput {
  state: string;
  city: string;
  territorySlug?: string | null;
}

export interface TouristPointDetailRouteInput
  extends TouristPointTerritoryRouteInput {
  slug: string;
}

export const TOURIST_POINT_PUBLIC_ROUTE_PARAMS = {
  territorySlug: TERRITORIAL_ROUTE_PARAMS.territorySlug,
  slug: TERRITORIAL_ROUTE_PARAMS.slug,
} as const;

function cleanRouteSegment(value: string, label: string): string {
  const raw = value.trim();
  if (!raw || /[/?#]/.test(raw)) {
    throw new Error(`${label} deve ser um unico segmento de rota.`);
  }

  const segment = raw
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/^-+|-+$/g, "");

  if (!segment) {
    throw new Error(`${label} deve ser um unico segmento de rota.`);
  }

  return segment;
}

function cleanOptionalRouteSegment(
  value: string | null | undefined,
  label: string,
): string | null {
  if (!value) return null;
  return cleanRouteSegment(value, label);
}

function buildTerritoryPath(input: TouristPointTerritoryRouteInput): string {
  const territorySlug = cleanOptionalRouteSegment(
    input.territorySlug,
    "territorio do ponto turistico",
  );
  return `/${[
    cleanRouteSegment(input.state, "estado do ponto turistico"),
    cleanRouteSegment(input.city, "cidade do ponto turistico"),
    ...(territorySlug ? [territorySlug] : []),
  ].join("/")}`;
}

function appendEntitySlug(base: string, slug: string): string {
  return `${base}/${cleanRouteSegment(slug, "slug do ponto turistico")}`;
}

function parseTerritoryRouteFromGeographicPath(
  geographicPath: string,
): TouristPointTerritoryRouteInput {
  const parts = normalizePublicTerritoryPath(geographicPath)
    .split("/")
    .filter(Boolean);
  const [state, city, territorySlug] = parts;

  if (!state || !city) {
    throw new Error(
      "geographic_path de ponto turistico sem estado/cidade canonicos.",
    );
  }

  return { state, city, territorySlug };
}

export const touristPointPublicRoutes = {
  home: () => buildAppModulePath(APP_MODULE_SLUGS.touristPoints),

  cityRoutePath: () =>
    buildTerritorialModuleRoutePath(APP_MODULE_SLUGS.touristPoints),
  territoryRoutePath: () =>
    buildScopedTerritorialModuleRoutePath(APP_MODULE_SLUGS.touristPoints),
  cityDetailRoutePath: () =>
    buildTerritorialModuleRoutePath(APP_MODULE_SLUGS.touristPoints, [
      TOURIST_POINT_PUBLIC_ROUTE_PARAMS.slug,
    ]),
  territoryDetailRoutePath: () =>
    buildScopedTerritorialModuleRoutePath(APP_MODULE_SLUGS.touristPoints, [
      TOURIST_POINT_PUBLIC_ROUTE_PARAMS.slug,
    ]),

  list: (input: TouristPointTerritoryRouteInput) =>
    buildModuleTerritoryUrl(
      APP_MODULE_SLUGS.touristPoints,
      buildTerritoryPath(input),
    ),
  detail: (input: TouristPointDetailRouteInput) =>
    appendEntitySlug(
      buildModuleTerritoryUrl(
        APP_MODULE_SLUGS.touristPoints,
        buildTerritoryPath(input),
      ),
      input.slug,
    ),
  listFromTerritoryPath: (territoryPath: string) =>
    buildModuleTerritoryUrl(
      APP_MODULE_SLUGS.touristPoints,
      normalizePublicTerritoryPath(territoryPath),
    ),
  detailFromTerritoryPath: (territoryPath: string, slug: string) =>
    appendEntitySlug(
      buildModuleTerritoryUrl(
        APP_MODULE_SLUGS.touristPoints,
        normalizePublicTerritoryPath(territoryPath),
      ),
      slug,
    ),
  listFromGeographicPath: (geographicPath: string) =>
    touristPointPublicRoutes.list(
      parseTerritoryRouteFromGeographicPath(geographicPath),
    ),
  detailFromGeographicPath: (geographicPath: string, slug: string) =>
    touristPointPublicRoutes.detail({
      ...parseTerritoryRouteFromGeographicPath(geographicPath),
      slug,
    }),
} as const;
