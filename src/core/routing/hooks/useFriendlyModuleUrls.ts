import { useParams } from "react-router-dom";
import { LAUNCH_URLS } from "@/config/territory";
import { isReservedSlug } from "@/core/routing/reservedSlugs";
import { useTerritorialContextOptional } from "@/core/routing/components/TerritorialLayout";
import { gastronomyPublicRoutes } from "@/core/verticals/gastronomy/routes/gastronomyPublicRoutes";
import { touristPointPublicRoutes } from "@/core/verticals/guide/routes/touristPointPublicRoutes";
import {
  buildCommunityTerritoryUrl,
  buildModuleTerritoryUrl,
  hasPublicCityTerritoryPath,
  type ModuleSlug,
  MODULE_SLUGS,
} from "@/core/routing/utils/territoryUrls";
import { usePublicBrowsingCity } from "@/core/location/hooks/usePublicBrowsingCity";

interface FriendlyRouteParams {
  state?: string;
  city?: string;
  district?: string;
  groupSlug?: string;
  groupSlugOrDistrict?: string;
}

export interface FriendlyModuleUrls {
  community: string;
  business: string;
  services: string;
  classifieds: string;
  gastronomy: string;
  gastronomyFavorites: string;
  events: string;
  jobs: string;
  touristPoints: string;
  ranking: string;
  map: string;
  base: string;
  landing: string;
  territoryName: string | null;
}

export function useFriendlyModuleUrls(): FriendlyModuleUrls {
  const { cityBasePath } = usePublicBrowsingCity();
  const territorialContext = useTerritorialContextOptional();
  const { state, city, district, groupSlug, groupSlugOrDistrict } =
    useParams<Record<string, string | undefined>>();

  if (territorialContext) {
    const territoryName =
      territorialContext.resolved?.kind === "group"
        ? territorialContext.resolved.group.name
        : territorialContext.resolved?.location.name ?? null;

    return buildTerritorialUrls(
      territorialContext.baseUrl,
      territoryName,
      territorialContext.communityBaseUrl,
    );
  }

  const hasTerritoryParams = Boolean(state && city && !isReservedSlug(state));

  if (hasTerritoryParams && state && city) {
    const territoryBase = groupSlug
      ? `/${state}/${city}/${groupSlug}`
      : district
        ? `/${state}/${city}/${district}`
      : groupSlugOrDistrict
        ? `/${state}/${city}/${groupSlugOrDistrict}`
        : `/${state}/${city}`;

    return buildTerritorialUrls(
      territoryBase,
      slugToTitle(groupSlug ?? district ?? groupSlugOrDistrict ?? city),
    );
  }

  return buildTerritorialUrls(cityBasePath, null);
}

function buildScopedModuleUrl(
  module: ModuleSlug,
  basePath: string,
  communityBaseUrl?: string | null,
): string {
  if (communityBaseUrl === basePath) {
    return `${basePath}/${module}`;
  }

  return buildModuleTerritoryUrl(module, basePath);
}

function buildTerritorialUrls(
  basePath: string,
  territoryName: string | null,
  communityBaseUrl?: string | null,
): FriendlyModuleUrls {
  const community = communityBaseUrl ??
    (hasPublicCityTerritoryPath(basePath)
      ? buildCommunityTerritoryUrl(basePath)
      : LAUNCH_URLS.community);

  return {
    base: basePath,
    landing: basePath,
    territoryName,
    community,
    business: buildScopedModuleUrl(MODULE_SLUGS.business, basePath, communityBaseUrl),
    services: buildScopedModuleUrl(MODULE_SLUGS.services, basePath, communityBaseUrl),
    classifieds: buildScopedModuleUrl(MODULE_SLUGS.classifieds, basePath, communityBaseUrl),
    gastronomy: buildScopedModuleUrl(MODULE_SLUGS.gastronomy, basePath, communityBaseUrl),
    gastronomyFavorites: gastronomyPublicRoutes.favorites(),
    events: buildScopedModuleUrl(MODULE_SLUGS.events, basePath, communityBaseUrl),
    jobs: buildScopedModuleUrl(MODULE_SLUGS.jobs, basePath, communityBaseUrl),
    touristPoints: touristPointPublicRoutes.listFromTerritoryPath(basePath),
    ranking: buildScopedModuleUrl(MODULE_SLUGS.ranking, basePath, communityBaseUrl),
    map: buildScopedModuleUrl(MODULE_SLUGS.map, basePath, communityBaseUrl),
  };
}

function slugToTitle(slug: string): string {
  const lowerCaseWords = new Set(["de", "da", "do", "das", "dos", "e", "em", "a", "o"]);

  return slug
    .split("-")
    .map((word, index) =>
      index === 0 || !lowerCaseWords.has(word)
        ? word.charAt(0).toUpperCase() + word.slice(1)
        : word,
    )
    .join(" ");
}
