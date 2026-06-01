/**
 * Hook para listar vendedores com anuncios ativos
 */

import { useQuery } from "@tanstack/react-query";
import { ClassifiedsService } from "@/core/classifieds/services";
import { useModuleTerritoryFilter } from "@/core/location/hooks/useModuleTerritoryFilter";
import { territoryFilterKey } from "@/core/location/hooks/useTerritoryFilter";
import type { ResolvedTerritory } from "@/core/routing/hooks/useResolveTerritoryFromUrl";
import type { TerritoryFilter } from "@/core/location/types";

export interface VendedorWithAds {
  id: string;
  name: string;
  avatar_url: string | null;
  neighborhood: string;
  active_ads_count: number;
  featured_ads: {
    id: string;
    title: string;
    price: number;
    photos: string[];
  }[];
}

export interface UseVendedoresOptions {
  routeResolved?: ResolvedTerritory | null;
  activeMemberIds?: string[];
  search?: string;
  territoryFilter?: TerritoryFilter;
}

export function useVendedores(options: UseVendedoresOptions = {}) {
  const { routeResolved, search } = options;
  const moduleTerritory = useModuleTerritoryFilter({ routeResolved });
  const filter = options.territoryFilter ?? moduleTerritory.territoryFilter;
  const filterKey = territoryFilterKey(filter);

  const query = useQuery({
    queryKey: ["vendedores", filterKey, search],
    queryFn: async () => {
      let result: VendedorWithAds[] = [];

      try {
        const sellers = await ClassifiedsService.queries.getSellersWithAds(filter);
        result = sellers.map((s) => ({
          id: s.id,
          name: s.name,
          avatar_url: s.avatar_url,
          neighborhood: s.neighborhood,
          active_ads_count: s.active_ads_count,
          featured_ads: s.featured_ads.map((ad) => ({
            id: ad.id,
            title: ad.title,
            price: ad.price,
            photos: ad.photos || [],
          })),
        }));
      } catch {
        result = [];
      }

      if (search) {
        const lower = search.toLowerCase();
        result = result.filter((v) => v.name.toLowerCase().includes(lower));
      }

      return result;
    },
  });

  return {
    vendedores: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
  };
}
