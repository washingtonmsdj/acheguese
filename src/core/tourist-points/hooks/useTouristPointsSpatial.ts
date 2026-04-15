/**
 * useTouristPointsSpatial - Hooks para busca espacial de pontos turísticos
 * 
 * Segue SSOT: Database → Service → Hook → Component
 * 
 * @module core/tourist-points/hooks
 */

import { useQuery } from '@tanstack/react-query';
import { spatialSearchService } from '@/core/geospatial/services/SpatialSearchService';
import type { SpatialSearchResult } from '@/core/geospatial/services/SpatialSearchService';

export interface BoundingBox {
  west: number;
  south: number;
  east: number;
  north: number;
}

/**
 * Hook para buscar pontos turísticos dentro de um bounding box (viewport do mapa)
 * 
 * Usa SpatialSearchService (SSOT) ao invés de acessar Supabase diretamente.
 * 
 * @example
 * ```tsx
 * const { data: points } = useTouristPointsByBounds({
 *   west: -38.52,
 *   south: -12.98,
 *   east: -38.48,
 *   north: -12.96,
 * });
 * ```
 */
export function useTouristPointsByBounds(
  bounds: BoundingBox | null,
  options?: { locationId?: string; enabled?: boolean }
) {
  return useQuery({
    queryKey: ['tourist-points-spatial-bounds', bounds, options?.locationId],
    queryFn: async (): Promise<SpatialSearchResult[]> => {
      if (!bounds) {
        console.log('[useTouristPointsByBounds] bounds is null');
        return [];
      }

      console.log('[useTouristPointsByBounds] fetching with bounds:', bounds, 'locationId:', options?.locationId);

      try {
        // SSOT: Usa SpatialSearchService ao invés de acessar Supabase diretamente
        const results = await spatialSearchService.searchByBounds({
          bounds,
          entityType: 'tourist_point',
          locationId: options?.locationId,
          limit: 200,
        });
        console.log('[useTouristPointsByBounds] results:', results);
        return results;
      } catch (error) {
        console.error('[useTouristPointsByBounds] error:', error);
        return []; // Fallback para array vazio em caso de erro
      }
    },
    enabled: options?.enabled !== false && bounds !== null,
    staleTime: 1000 * 60 * 2, // 2 minutos
    retry: false, // Não retentar em caso de erro
    placeholderData: (previousData) => previousData, // Manter dados anteriores enquanto busca novos
  });
}
