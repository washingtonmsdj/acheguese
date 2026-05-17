import type { TerritoryFilter } from "@/core/location";
import type { ResolvedTerritory } from "@/core/routing/hooks/useResolveTerritoryFromUrl";

interface ResolveCommunityFeedTerritoryFilterInput {
  baseFilter: TerritoryFilter;
  locationScope: "city" | "neighborhood" | "street";
  resolved?: ResolvedTerritory;
  homeCityId?: string | null;
  homeDistrictId?: string | null;
}

/**
 * SSOT para o filtro territorial efetivo do feed da comunidade.
 *
 * Regras:
 * - Se o territorio base e grupo, nunca reduzir para um unico bairro.
 * - Scope "city" privilegia a cidade da rota atual quando disponivel.
 * - Scope "neighborhood" privilegia o bairro da rota atual quando disponivel.
 * - Fallbacks usam homeCity/homeDistrict apenas quando a rota nao resolve esse nivel.
 */
export function resolveCommunityFeedTerritoryFilter({
  baseFilter,
  locationScope,
  resolved,
  homeCityId,
  homeDistrictId,
}: ResolveCommunityFeedTerritoryFilterInput): TerritoryFilter {
  if (baseFilter.scope === "group") {
    return baseFilter;
  }

  if (locationScope === "city") {
    if (resolved?.kind === "location") {
      if (resolved.location.type === "city") {
        return { scope: "location", location_id: resolved.location.id };
      }
      if (resolved.location.type === "district" && resolved.location.parent_id) {
        return { scope: "location", location_id: resolved.location.parent_id };
      }
    }

    if (homeCityId) {
      return { scope: "location", location_id: homeCityId };
    }
  }

  if (locationScope === "neighborhood") {
    if (resolved?.kind === "location" && resolved.location.type === "district") {
      return { scope: "location", location_id: resolved.location.id };
    }

    if (homeDistrictId) {
      return { scope: "location", location_id: homeDistrictId };
    }
  }

  return baseFilter;
}
