import { APP_MODULE_SLUGS, buildAppModulePath } from "@/config/moduleSlugs";
import {
  TERRITORIAL_ROUTE_PARAMS,
  buildTerritorialModuleRoutePath,
} from "@/core/routing/config/territorialRoutePatterns";
import { normalizePublicTerritoryPath } from "@/core/routing/utils/territoryUrls";

export interface TouristPointTerritoryRouteInput {
  state: string;
  city: string;
  district?: string | null;
}

export interface TouristPointDetailRouteInput extends TouristPointTerritoryRouteInput {
  slug: string;
}

export const TOURIST_POINT_PUBLIC_ROUTE_PARAMS = {
  districtOrSlug: TERRITORIAL_ROUTE_PARAMS.groupSlugOrDistrict,
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

function cleanOptionalRouteSegment(value: string | null | undefined, label: string): string | null {
  if (!value) return null;
  return cleanRouteSegment(value, label);
}

function buildTerritorySegments(input: TouristPointTerritoryRouteInput): string[] {
  const district = cleanOptionalRouteSegment(input.district, "bairro do ponto turistico");
  return [
    cleanRouteSegment(input.state, "estado do ponto turistico"),
    cleanRouteSegment(input.city, "cidade do ponto turistico"),
    ...(district ? [district] : []),
  ];
}

function buildRouteFromTerritoryPath(
  territoryPath: string,
  suffixSegments: readonly string[] = [],
): string {
  const territorySegments = normalizePublicTerritoryPath(territoryPath).split("/").filter(Boolean);
  if (territorySegments.length < 2) {
    throw new Error("rota de ponto turistico exige territorio publico com estado/cidade.");
  }

  const normalizedSegments = [
    cleanRouteSegment(territorySegments[0], "estado do ponto turistico"),
    cleanRouteSegment(territorySegments[1], "cidade do ponto turistico"),
    ...territorySegments
      .slice(2)
      .map((segment) => cleanRouteSegment(segment, "territorio do ponto turistico")),
    ...suffixSegments.map((segment) => cleanRouteSegment(segment, "slug do ponto turistico")),
  ];

  return buildAppModulePath(APP_MODULE_SLUGS.touristPoints, normalizedSegments.join("/"));
}

function parseTerritoryRouteFromGeographicPath(
  geographicPath: string,
): TouristPointTerritoryRouteInput {
  const parts = normalizePublicTerritoryPath(geographicPath).split("/").filter(Boolean);
  const [state, city, district] = parts;

  if (!state || !city) {
    throw new Error("geographic_path de ponto turistico sem estado/cidade canonicos.");
  }

  return {
    state,
    city,
    district,
  };
}

export const touristPointPublicRoutes = {
  cityRoutePath: () => buildTerritorialModuleRoutePath(APP_MODULE_SLUGS.touristPoints),
  districtOrDetailRoutePath: () =>
    buildTerritorialModuleRoutePath(APP_MODULE_SLUGS.touristPoints, [
      TOURIST_POINT_PUBLIC_ROUTE_PARAMS.districtOrSlug,
    ]),
  detailWithTerritoryRoutePath: () =>
    buildTerritorialModuleRoutePath(APP_MODULE_SLUGS.touristPoints, [
      TOURIST_POINT_PUBLIC_ROUTE_PARAMS.districtOrSlug,
      TOURIST_POINT_PUBLIC_ROUTE_PARAMS.slug,
    ]),
  list: (input: TouristPointTerritoryRouteInput) =>
    buildAppModulePath(APP_MODULE_SLUGS.touristPoints, buildTerritorySegments(input).join("/")),
  detail: (input: TouristPointDetailRouteInput) =>
    buildAppModulePath(
      APP_MODULE_SLUGS.touristPoints,
      [...buildTerritorySegments(input), cleanRouteSegment(input.slug, "slug do ponto turistico")].join(
        "/",
      ),
    ),
  listFromTerritoryPath: (territoryPath: string) => buildRouteFromTerritoryPath(territoryPath),
  detailFromTerritoryPath: (territoryPath: string, slug: string) =>
    buildRouteFromTerritoryPath(territoryPath, [slug]),
  listFromGeographicPath: (geographicPath: string) =>
    touristPointPublicRoutes.list(parseTerritoryRouteFromGeographicPath(geographicPath)),
  detailFromGeographicPath: (geographicPath: string, slug: string) =>
    touristPointPublicRoutes.detail({
      ...parseTerritoryRouteFromGeographicPath(geographicPath),
      slug,
    }),
} as const;
