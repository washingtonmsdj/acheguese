import { useParams } from "react-router-dom";
import { isReservedSlug } from "@/core/routing/reservedSlugs";
import { buildCommunityTerritoryUrl, buildModuleTerritoryUrl, MODULE_SLUGS } from "@/core/routing/utils/territoryUrls";
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
  const { state, city, district, groupSlug, groupSlugOrDistrict } =
    useParams<Record<string, string | undefined>>();
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

function buildTerritorialUrls(basePath: string, territoryName: string | null): FriendlyModuleUrls {
  return {
    base: basePath,
    landing: basePath,
    territoryName,
    community: buildCommunityTerritoryUrl(basePath),
    business: buildModuleTerritoryUrl(MODULE_SLUGS.business, basePath),
    services: buildModuleTerritoryUrl(MODULE_SLUGS.services, basePath),
    classifieds: buildModuleTerritoryUrl(MODULE_SLUGS.classifieds, basePath),
    gastronomy: buildModuleTerritoryUrl(MODULE_SLUGS.gastronomy, basePath),
    gastronomyFavorites: "/gastronomia/favoritos",
    events: buildModuleTerritoryUrl(MODULE_SLUGS.events, basePath),
    jobs: buildModuleTerritoryUrl(MODULE_SLUGS.jobs, basePath),
    touristPoints: `/pontos-turisticos${basePath}`,
    ranking: buildModuleTerritoryUrl(MODULE_SLUGS.ranking, basePath),
    map: buildModuleTerritoryUrl(MODULE_SLUGS.map, basePath),
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
