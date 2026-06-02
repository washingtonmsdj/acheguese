import { useMemo, useSyncExternalStore } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { LAUNCH_URLS, TERRITORY_CONFIG } from "@/config/territory";
import { useUserTerritory } from "@/core/location/hooks/useUserTerritory";
import { territorialGroupService } from "@/core/territorial/services/TerritorialGroupService";
import { resolveHomeCommunityHref } from "@/core/routing/utils/homeCommunityHref";
import { lastTerritoryStore, type LastTerritory } from "@/core/routing/stores/LastTerritoryStore";
import { CommunityPublicAliasService } from "@/core/routing/services/CommunityPublicAliasService";
import {
  buildCommunityTerritoryUrl,
  extractCommunityTerritoryBaseUrl,
} from "@/core/routing/utils/territoryUrls";

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

  const { data: fallbackGroup = null } = useQuery({
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

      const group = candidates[0];
      return group ? { id: group.id, slug: group.slug } : null;
    },
    enabled: true,
    staleTime: 10 * 60 * 1000,
    retry: false,
  });

  const fallbackCityPath = homeCity?.path ?? `/${TERRITORY_CONFIG.launch.state}/${TERRITORY_CONFIG.launch.city}`;
  const aliasCandidateKey = useMemo(
    () => ({
      homeCityPath: homeCity?.path ?? null,
      homeDistrictPath: homeDistrict?.path ?? null,
      homeDistrictId: homeDistrict?.id ?? null,
      fallbackCityPath,
      fallbackGroup,
      groups: groups
        .filter((group) => String(group.status).toLowerCase() === "active")
        .map((group) => ({
          id: group.id,
          slug: group.slug,
        }))
        .sort((a, b) => a.slug.localeCompare(b.slug)),
    }),
    [
      fallbackCityPath,
      fallbackGroup,
      groups,
      homeCity?.path,
      homeDistrict?.id,
      homeDistrict?.path,
    ],
  );

  const { data: communityUrlsByTerritoryBaseUrl = {} } = useQuery({
    queryKey: ["home-community-public-alias-urls", aliasCandidateKey],
    queryFn: async () => {
      const entries: Array<[string, string]> = [];

      async function addAliasUrl(
        territoryBaseUrl: string | null | undefined,
        reference: Parameters<typeof CommunityPublicAliasService.findPublicUrlForTerritory>[0],
      ) {
        if (!territoryBaseUrl || !reference.territoryId) return;
        const url = await CommunityPublicAliasService.findPublicUrlForTerritory(reference);
        if (url) entries.push([territoryBaseUrl.replace(/\/+$/, ""), url]);
      }

      await Promise.all([
        ...aliasCandidateKey.groups.map((group) =>
          addAliasUrl(
            aliasCandidateKey.homeCityPath
              ? `${aliasCandidateKey.homeCityPath}/${group.slug}`
              : null,
            {
              kind: "group",
              territoryId: group.id,
            },
          ),
        ),
        addAliasUrl(aliasCandidateKey.homeDistrictPath, {
          kind: "location",
          territoryId: aliasCandidateKey.homeDistrictId,
        }),
        aliasCandidateKey.fallbackGroup
          ? addAliasUrl(
              `${aliasCandidateKey.fallbackCityPath}/${aliasCandidateKey.fallbackGroup.slug}`,
              {
                kind: "group",
                territoryId: aliasCandidateKey.fallbackGroup.id,
              },
            )
          : Promise.resolve(),
      ]);

      return Object.fromEntries(entries);
    },
    staleTime: 10 * 60 * 1000,
    retry: false,
  });

  return useMemo(() => {
    const fallbackHref = (() => {
      if (fallbackGroup) {
        return buildCommunityTerritoryUrl(`${fallbackCityPath}/${fallbackGroup.slug}`);
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
      communityUrlsByTerritoryBaseUrl,
    });
  }, [
    groups,
    homeCity?.path,
    homeDistrict?.path,
    pathname,
    lastTerritory?.baseUrl,
    fallbackGroup,
    fallbackCityPath,
    communityUrlsByTerritoryBaseUrl,
  ]);
}

function extractCurrentTerritoryBaseUrl(pathname: string): string | null {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length < 3) return null;

  // /comunidade/:state/:city[/...]
  if (parts[0] === "comunidade") {
    return extractCommunityTerritoryBaseUrl(pathname);
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

  // /[module]/:state/:city[/...]
  if (moduleSlugs.has(parts[0]) && parts.length >= 3) {
    const firstAfterCity = parts[3];
    if (firstAfterCity && !["categoria", "evento", "calendario", "favoritos", "mapa", "profissional", "publicar"].includes(firstAfterCity)) {
      return `/${parts[1]}/${parts[2]}/${firstAfterCity}`;
    }
    return `/${parts[1]}/${parts[2]}`;
  }

  // /:state/:city[/...]
  const statePattern = /^[a-z]{2}$/i;
  if (statePattern.test(parts[0]) && parts[1]) {
    return `/${parts[0]}/${parts[1]}`;
  }

  return null;
}
