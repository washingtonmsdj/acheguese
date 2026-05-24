import { useMemo, useSyncExternalStore } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { LAUNCH_URLS, TERRITORY_CONFIG } from "@/config/territory";
import { useUserTerritory } from "@/core/location/hooks/useUserTerritory";
import { territorialGroupService } from "@/core/territorial/services/TerritorialGroupService";
import { resolveHomeCommunityHref } from "@/core/routing/utils/homeCommunityHref";
import { lastTerritoryStore, type LastTerritory } from "@/core/routing/stores/LastTerritoryStore";
import { buildCommunityTerritoryUrl } from "@/core/routing/utils/territoryUrls";

function toPublicPathFromGeographicPath(path: string | null | undefined): string | null {
  if (!path) return null;
  const parts = path.split("/").filter(Boolean);
  if (parts.length === 0) return null;

  const publicParts = parts[0].toLowerCase() === "br" ? parts.slice(1) : parts;
  if (publicParts.length === 0) return null;
  return `/${publicParts.join("/")}`;
}

export function useHomeCommunityHref(): string {
  const { homeDistrict, homeCity } = useUserTerritory();
  const { pathname } = useLocation();
  const lastTerritory = useSyncExternalStore<LastTerritory | null>(
    (listener) => lastTerritoryStore.subscribe(listener),
    () => lastTerritoryStore.get(),
  );

  const { data: groups = [] } = useQuery({
    queryKey: ["home-community-groups", homeDistrict?.id],
    queryFn: async () => {
      if (!homeDistrict?.id) return [];
      return territorialGroupService.findGroupsContainingLocation(homeDistrict.id);
    },
    enabled: Boolean(homeDistrict?.id),
    staleTime: 10 * 60 * 1000,
    retry: false,
  });

  const { data: fallbackGroupSlug = null } = useQuery({
    queryKey: ["home-community-fallback-group", homeCity?.id, homeCity?.path],
    queryFn: async () => {
      const launchCityPath = `/${TERRITORY_CONFIG.launch.state}/${TERRITORY_CONFIG.launch.city}`;
      const targetCityPath = homeCity?.path ?? launchCityPath;

      const allGroups = await territorialGroupService.listAllGroups();
      const activeGroups = allGroups
        .filter((group) => String(group.status).toLowerCase() === "active")
        .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

      const candidates = (homeCity?.id
        ? activeGroups.filter((group) => group.anchor_city_id === homeCity.id)
        : activeGroups.filter((group) => {
            const cityPrefix = `${targetCityPath}/`;
            return group.members.some((member) => {
              const memberPath = toPublicPathFromGeographicPath(member.geographic_path);
              return Boolean(memberPath?.startsWith(cityPrefix));
            });
          }))
        .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

      return candidates[0]?.slug ?? null;
    },
    enabled: true,
    staleTime: 10 * 60 * 1000,
    retry: false,
  });

  const fallbackCityPath = homeCity?.path ?? `/${TERRITORY_CONFIG.launch.state}/${TERRITORY_CONFIG.launch.city}`;

  return useMemo(() => {
    const fallbackHref = (() => {
      if (fallbackGroupSlug) {
        return buildCommunityTerritoryUrl(`${fallbackCityPath}/${fallbackGroupSlug}`);
      }
      return LAUNCH_URLS.community;
    })();

    return resolveHomeCommunityHref({
      groups,
      homeCityPath: homeCity?.path,
      homeDistrictPath: homeDistrict?.path,
      currentTerritoryBaseUrl: extractCurrentTerritoryBaseUrl(pathname),
      lastTerritoryBaseUrl: lastTerritory?.baseUrl,
      fallbackHref,
    });
  }, [groups, homeCity?.path, homeDistrict?.path, pathname, lastTerritory?.baseUrl, fallbackGroupSlug, fallbackCityPath]);
}

function extractCurrentTerritoryBaseUrl(pathname: string): string | null {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length < 3) return null;

  // /comunidade/:state/:city/:territorySlug[/...]
  if (parts[0] === "comunidade" && parts.length >= 4) {
    return `/${parts[1]}/${parts[2]}/${parts[3]}`;
  }

  const moduleSlugs = new Set([
    "buscar",
    "empresas",
    "servicos",
    "classificados",
    "eventos",
    "mapa",
    "gastronomia",
    "gastronomia-premium",
    "educacao",
    "vagas",
    "pontos-turisticos",
    "guia",
  ]);

  // /[module]/:state/:city/:territorySlug[/...]
  if (moduleSlugs.has(parts[0]) && parts.length >= 4) {
    return `/${parts[1]}/${parts[2]}/${parts[3]}`;
  }

  // /:state/:city/:territorySlug
  const statePattern = /^[a-z]{2}$/i;
  if (statePattern.test(parts[0])) {
    return `/${parts[0]}/${parts[1]}/${parts[2]}`;
  }

  return null;
}
