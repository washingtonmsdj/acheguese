/**
 * useTouristPoints — Hook público de listagem por território
 *
 * Orquestra estado de loading/error/data.
 * Nenhuma regra de negócio aqui — tudo no service.
 */

import { useQuery } from '@tanstack/react-query';
import { TouristPointQueryService } from '../services/TouristPointQueryService';
import type { TerritoryFilter } from '@/core/location/types';

export function useTouristPoints(filter: TerritoryFilter, options?: { is_featured?: boolean }) {
  return useQuery({
    queryKey: ['guide:tourist-points', filter, options],
    queryFn: async () => {
      const locationIds = await TouristPointQueryService.resolveLocationIdsFromFilter(filter);
      if (locationIds.length === 0) return [];
      
      return TouristPointQueryService.listPublished({
        location_ids: locationIds,
        is_featured:  options?.is_featured,
      });
    },
    enabled: filter.scope !== 'none',
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

export function useTouristPointsCount(filter: TerritoryFilter) {
  return useQuery({
    queryKey: ['guide:tourist-points:count', filter],
    queryFn: async () => {
      const locationIds = await TouristPointQueryService.resolveLocationIdsFromFilter(filter);
      if (locationIds.length === 0) return 0;
      
      return TouristPointQueryService.countPublished(locationIds);
    },
    enabled: filter.scope !== 'none',
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}
