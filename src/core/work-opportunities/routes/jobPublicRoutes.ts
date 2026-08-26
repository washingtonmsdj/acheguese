import { APP_MODULE_SLUGS, buildAppModulePath } from "@/config/moduleSlugs";
import { TERRITORIAL_ROUTE_STATIC_SEGMENTS } from "@/core/routing/config/territorialRoutePatterns";

export interface JobTerritoryRouteInput {
  state: string;
  city: string;
}

export interface JobDetailRouteInput extends JobTerritoryRouteInput {
  slug: string;
}

function cleanRouteSegment(value: string, label: string): string {
  const segment = value.trim().replace(/^\/+|\/+$/g, "").toLowerCase();
  if (!segment || /[/?#]/.test(segment)) {
    throw new Error(`${label} deve ser um unico segmento de rota.`);
  }
  return segment;
}

function parseCityRouteFromGeographicPath(geographicPath: string): JobTerritoryRouteInput {
  const parts = geographicPath.split("/").filter(Boolean);
  const state = parts[1];
  const city = parts[2];

  if (!state || !city) {
    throw new Error("geographic_path de vaga sem estado/cidade canonicos.");
  }

  return {
    state: cleanRouteSegment(state, "estado da vaga"),
    city: cleanRouteSegment(city, "cidade da vaga"),
  };
}

export const jobPublicRoutes = {
  home: () => buildAppModulePath(APP_MODULE_SLUGS.jobs),
  publish: () =>
    buildAppModulePath(APP_MODULE_SLUGS.jobs, TERRITORIAL_ROUTE_STATIC_SEGMENTS.publish),
  list: (input: JobTerritoryRouteInput) =>
    buildAppModulePath(
      APP_MODULE_SLUGS.jobs,
      `${cleanRouteSegment(input.state, "estado da vaga")}/${cleanRouteSegment(input.city, "cidade da vaga")}`,
    ),
  detail: (input: JobDetailRouteInput) =>
    buildAppModulePath(
      APP_MODULE_SLUGS.jobs,
      [
        cleanRouteSegment(input.state, "estado da vaga"),
        cleanRouteSegment(input.city, "cidade da vaga"),
        cleanRouteSegment(input.slug, "slug da vaga"),
      ].join("/"),
    ),
  listFromGeographicPath: (geographicPath: string) =>
    jobPublicRoutes.list(parseCityRouteFromGeographicPath(geographicPath)),
  detailFromGeographicPath: (geographicPath: string, slug: string) =>
    jobPublicRoutes.detail({
      ...parseCityRouteFromGeographicPath(geographicPath),
      slug,
    }),
} as const;
