import { useParams } from "react-router-dom";
import { isReservedSlug } from "@/core/routing/reservedSlugs";

interface FriendlyRouteParams {
  state?: string;
  city?: string;
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
  const { state, city, groupSlugOrDistrict } = useParams<FriendlyRouteParams>();
  const hasTerritoryParams = Boolean(state && city && !isReservedSlug(state));

  if (hasTerritoryParams && state && city) {
    const territoryBase = groupSlugOrDistrict
      ? `/${state}/${city}/${groupSlugOrDistrict}`
      : `/${state}/${city}`;

    return buildTerritorialUrls(
      territoryBase,
      slugToTitle(groupSlugOrDistrict ?? city),
    );
  }

  return {
    base: "/",
    landing: "/",
    territoryName: null,
    community: "/comunidade",
    business: "/empresas",
    services: "/servicos",
    classifieds: "/classificados",
    gastronomy: "/gastronomia",
    gastronomyFavorites: "/gastronomia/favoritos",
    events: "/eventos",
    jobs: "/vagas",
    touristPoints: "/pontos-turisticos",
    ranking: "/ranking",
    map: "/mapa",
  };
}

function buildTerritorialUrls(basePath: string, territoryName: string | null): FriendlyModuleUrls {
  return {
    base: basePath,
    landing: basePath,
    territoryName,
    community: `/comunidade${basePath}`,
    business: `/empresas${basePath}`,
    services: `/servicos${basePath}`,
    classifieds: `/classificados${basePath}`,
    gastronomy: `/gastronomia${basePath}`,
    gastronomyFavorites: "/gastronomia/favoritos",
    events: `/eventos${basePath}`,
    jobs: `/vagas${basePath}`,
    touristPoints: `/pontos-turisticos${basePath}`,
    ranking: `/ranking${basePath}`,
    map: `/mapa${basePath}`,
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
