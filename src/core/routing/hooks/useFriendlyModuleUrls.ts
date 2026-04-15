/**
 * useFriendlyModuleUrls
 *
 * Retorna URLs amigaveis dos modulos (sem /br, modulo primeiro).
 *
 * Ordem de prioridade:
 * 1. Params da URL atual
 * 2. activeLocation do store
 * 3. lastTerritoryStore
 * 4. Territorio de lancamento
 */

import { useSyncExternalStore } from "react";
import { useParams } from "react-router-dom";
import { LAUNCH_URLS, TERRITORY_CONFIG } from "@/config/territory";
import { useActiveTerritory } from "@/core/location/hooks/useActiveTerritory";
import { isReservedSlug } from "@/core/routing/reservedSlugs";
import type { LastTerritory } from "../stores/LastTerritoryStore";
import { lastTerritoryStore } from "../stores/LastTerritoryStore";
import { geoPathToPublicUrl } from "../utils/territoryUrls";

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
  const { activeLocation } = useActiveTerritory();

  const lastTerritory = useSyncExternalStore<LastTerritory | null>(
    lastTerritoryStore.subscribe.bind(lastTerritoryStore),
    lastTerritoryStore.get.bind(lastTerritoryStore),
  );

  const hasTerritoryParams = Boolean(state && city && !isReservedSlug(state));

  if (hasTerritoryParams && state && city) {
    const territorySlug = resolveTerritorySlug({
      state,
      city,
      routeSlug: groupSlugOrDistrict,
      lastTerritory,
    });

    const territoryBase = territorySlug
      ? `/${state}/${city}/${territorySlug}`
      : `/${state}/${city}`;

    return buildFriendlyUrls(
      territoryBase,
      slugToTitle(territorySlug ?? city),
    );
  }

  if (activeLocation?.geographic_path) {
    return buildFriendlyUrls(
      geoPathToPublicUrl(activeLocation.geographic_path),
      activeLocation.name,
    );
  }

  if (lastTerritory?.baseUrl) {
    return buildFriendlyUrls(lastTerritory.baseUrl, lastTerritory.name);
  }

  return {
    base: `/${TERRITORY_CONFIG.launch.state}/${TERRITORY_CONFIG.launch.city}`,
    landing: `/${TERRITORY_CONFIG.launch.state}/${TERRITORY_CONFIG.launch.city}`,
    territoryName: TERRITORY_CONFIG.launch.name,
    community: LAUNCH_URLS.community,
    business: LAUNCH_URLS.business,
    services: LAUNCH_URLS.services,
    classifieds: LAUNCH_URLS.classifieds,
    gastronomy: LAUNCH_URLS.gastronomy,
    gastronomyFavorites: '/gastronomia/favoritos',
    events: LAUNCH_URLS.events,
    jobs: LAUNCH_URLS.jobs,
    touristPoints: `/pontos-turisticos/${TERRITORY_CONFIG.launch.state}/${TERRITORY_CONFIG.launch.city}`,
    ranking: `/ranking/${TERRITORY_CONFIG.launch.state}/${TERRITORY_CONFIG.launch.city}`,
    map: `/mapa/${TERRITORY_CONFIG.launch.state}/${TERRITORY_CONFIG.launch.city}`,
  };
}

function buildFriendlyUrls(basePath: string, territoryName: string | null): FriendlyModuleUrls {
  return {
    base: basePath,
    landing: basePath,
    territoryName,
    community: `/comunidade${basePath}`,
    business: `/empresas${basePath}`,
    services: `/servicos${basePath}`,
    classifieds: `/classificados${basePath}`,
    gastronomy: `/gastronomia${basePath}`,
    gastronomyFavorites: '/gastronomia/favoritos',
    events: `/eventos${basePath}`,
    jobs: `/vagas${basePath}`,
    touristPoints: `/pontos-turisticos${basePath}`,
    ranking: `/ranking${basePath}`,
    map: `/mapa${basePath}`,
  };
}

function resolveTerritorySlug({
  state,
  city,
  routeSlug,
  lastTerritory,
}: {
  state: string;
  city: string;
  routeSlug?: string;
  lastTerritory: LastTerritory | null;
}): string | undefined {
  if (routeSlug) {
    return routeSlug;
  }

  if (!lastTerritory?.baseUrl) {
    return undefined;
  }

  const parts = lastTerritory.baseUrl.split("/").filter(Boolean);
  if (parts.length === 3 && parts[0] === state && parts[1] === city) {
    return parts[2];
  }

  return undefined;
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
