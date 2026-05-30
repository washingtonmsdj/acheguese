import { APP_MODULE_SLUGS, buildAppModulePath } from "@/config/moduleSlugs";
import {
  TERRITORIAL_ROUTE_PARAMS,
  TERRITORIAL_ROUTE_STATIC_SEGMENTS,
  buildTerritorialModuleRoutePath,
} from "@/core/routing/config/territorialRoutePatterns";

export interface ProfessionalTerritoryRouteInput {
  state: string;
  city: string;
}

export interface ProfessionalDetailRouteInput extends ProfessionalTerritoryRouteInput {
  slug: string;
}

function cleanRouteSegment(value: string, label: string): string {
  const raw = value.trim();
  if (!raw || /[/?#]/.test(raw)) {
    throw new Error(`${label} deve ser um unico segmento de rota.`);
  }

  const segment = raw
    .trim()
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

function parseCityRouteFromGeographicPath(
  geographicPath: string,
): ProfessionalTerritoryRouteInput {
  const parts = geographicPath.split("/").filter(Boolean);
  const territoryParts = parts.at(0) === "br" ? parts.slice(1) : parts;
  const [state, city] = territoryParts;

  if (!state || !city) {
    throw new Error("geographic_path de profissional sem estado/cidade canonicos.");
  }

  return {
    state: cleanRouteSegment(state, "estado do profissional"),
    city: cleanRouteSegment(city, "cidade do profissional"),
  };
}

export const professionalPublicRoutes = {
  home: () => buildAppModulePath(APP_MODULE_SLUGS.services),
  register: () => buildAppModulePath(APP_MODULE_SLUGS.services, "cadastrar"),
  detailRoutePath: () =>
    buildTerritorialModuleRoutePath(APP_MODULE_SLUGS.services, [
      TERRITORIAL_ROUTE_STATIC_SEGMENTS.professional,
      TERRITORIAL_ROUTE_PARAMS.slug,
    ]),
  detailPreview: (slug: string) =>
    (() => {
      try {
        return buildAppModulePath(
          APP_MODULE_SLUGS.services,
          [
            TERRITORIAL_ROUTE_PARAMS.state,
            TERRITORIAL_ROUTE_PARAMS.city,
            TERRITORIAL_ROUTE_STATIC_SEGMENTS.professional,
            cleanRouteSegment(slug, "slug do profissional"),
          ].join("/"),
        );
      } catch {
        return "";
      }
    })(),
  list: (input: ProfessionalTerritoryRouteInput) =>
    buildAppModulePath(
      APP_MODULE_SLUGS.services,
      `${cleanRouteSegment(input.state, "estado do profissional")}/${cleanRouteSegment(
        input.city,
        "cidade do profissional",
      )}`,
    ),
  detail: (input: ProfessionalDetailRouteInput) =>
    buildAppModulePath(
      APP_MODULE_SLUGS.services,
      [
        cleanRouteSegment(input.state, "estado do profissional"),
        cleanRouteSegment(input.city, "cidade do profissional"),
        TERRITORIAL_ROUTE_STATIC_SEGMENTS.professional,
        cleanRouteSegment(input.slug, "slug do profissional"),
      ].join("/"),
    ),
  listFromGeographicPath: (geographicPath: string) =>
    professionalPublicRoutes.list(parseCityRouteFromGeographicPath(geographicPath)),
  detailFromGeographicPath: (geographicPath: string, slug: string) =>
    professionalPublicRoutes.detail({
      ...parseCityRouteFromGeographicPath(geographicPath),
      slug,
    }),
} as const;
