import { useLocation, useParams } from "react-router-dom";
import { LAUNCH_URLS } from "@/config/territory";
import { isReservedSlug } from "@/core/routing/reservedSlugs";
import { useTerritorialContextOptional } from "@/core/routing/components/TerritorialLayout";
import { gastronomyPublicRoutes } from "@/core/verticals/gastronomy/routes/gastronomyPublicRoutes";
import { touristPointPublicRoutes } from "@/core/verticals/guide/routes/touristPointPublicRoutes";
import {
  buildCommunityTerritoryUrl,
  hasPublicCityTerritoryPath,
  MODULE_SLUGS,
} from "@/core/routing/utils/territoryUrls";
import {
  buildContextualModuleUrl,
  shouldUseCommunityScopedModuleUrls,
} from "@/core/routing/utils/communityModuleUrls";
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
  const { pathname } = useLocation();
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
      shouldUseCommunityScopedModuleUrls({
        pathname,
        territoryBaseUrl: territorialContext.baseUrl,
        communityBaseUrl: territorialContext.communityBaseUrl,
      }),
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

function buildTerritorialUrls(
  basePath: string,
  territoryName: string | null,
  communityBaseUrl?: string | null,
  useCommunityScopedModules = false,
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
    business: buildContextualModuleUrl({
      module: MODULE_SLUGS.business,
      territoryBaseUrl: basePath,
      communityBaseUrl,
      useCommunityScopedModules,
    }),
    services: buildContextualModuleUrl({
      module: MODULE_SLUGS.services,
      territoryBaseUrl: basePath,
      communityBaseUrl,
      useCommunityScopedModules,
    }),
    classifieds: buildContextualModuleUrl({
      module: MODULE_SLUGS.classifieds,
      territoryBaseUrl: basePath,
      communityBaseUrl,
      useCommunityScopedModules,
    }),
    gastronomy: buildContextualModuleUrl({
      module: MODULE_SLUGS.gastronomy,
      territoryBaseUrl: basePath,
      communityBaseUrl,
      useCommunityScopedModules,
    }),
    gastronomyFavorites: gastronomyPublicRoutes.favorites(),
    events: buildContextualModuleUrl({
      module: MODULE_SLUGS.events,
      territoryBaseUrl: basePath,
      communityBaseUrl,
      useCommunityScopedModules,
    }),
    jobs: buildContextualModuleUrl({
      module: MODULE_SLUGS.jobs,
      territoryBaseUrl: basePath,
      communityBaseUrl,
      useCommunityScopedModules,
    }),
    touristPoints: touristPointPublicRoutes.listFromTerritoryPath(basePath),
    ranking: buildContextualModuleUrl({
      module: MODULE_SLUGS.ranking,
      territoryBaseUrl: basePath,
      communityBaseUrl,
      useCommunityScopedModules,
    }),
    map: buildContextualModuleUrl({
      module: MODULE_SLUGS.map,
      territoryBaseUrl: basePath,
      communityBaseUrl,
      useCommunityScopedModules,
    }),
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
