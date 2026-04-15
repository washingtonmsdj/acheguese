/**
 * useSpatialSearch - Hook para busca espacial
 * 
 * Permite buscar entidades por:
 * - Raio de distância
 * - Bounding box (viewport)
 * - Busca híbrida (raio + território)
 * 
 * @module core/geospatial/hooks
 */

import { useQuery } from '@tanstack/react-query';
import { spatialSearchService } from '../services/SpatialSearchService';
import type {
  EntityType,
  SearchByRadiusInput,
  SearchByBoundsInput,
  SearchHybridInput,
  SpatialSearchResult,
} from '../services/SpatialSearchService';

// ============================================
// BUSCA POR RAIO
// ============================================

export interface UseSpatialSearchByRadiusOptions {
  center: { latitude: number; longitude: number };
  radiusKm: number;
  entityType: EntityType;
  locationId?: string;
  limit?: number;
  offset?: number;
  enabled?: boolean;
}

/**
 * Hook para buscar entidades dentro de um raio específico
 * 
 * @example
 * ```tsx
 * const { data: businesses, isLoading } = useSpatialSearchByRadius({
 *   center: { latitude: -12.9714, longitude: -38.5014 },
 *   radiusKm: 2,
 *   entityType: 'business',
 *   limit: 20
 * });
 * ```
 */
export function useSpatialSearchByRadius(options: UseSpatialSearchByRadiusOptions) {
  return useQuery({
    queryKey: [
      'spatial-search',
      'radius',
      options.entityType,
      options.center.latitude,
      options.center.longitude,
      options.radiusKm,
      options.locationId,
      options.limit,
      options.offset,
    ],
    queryFn: async (): Promise<SpatialSearchResult[]> => {
      return await spatialSearchService.searchByRadius({
        center: options.center,
        radiusKm: options.radiusKm,
        entityType: options.entityType,
        locationId: options.locationId,
        limit: options.limit,
        offset: options.offset,
      });
    },
    enabled: options.enabled !== false,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

// ============================================
// BUSCA POR BOUNDING BOX
// ============================================

export interface UseSpatialSearchByBoundsOptions {
  bounds: {
    west: number;
    south: number;
    east: number;
    north: number;
  };
  entityType: EntityType;
  locationId?: string;
  limit?: number;
  enabled?: boolean;
}

/**
 * Hook para buscar entidades dentro de um bounding box (viewport do mapa)
 * 
 * @example
 * ```tsx
 * const { data: markers } = useSpatialSearchByBounds({
 *   bounds: { west: -38.52, south: -12.98, east: -38.48, north: -12.96 },
 *   entityType: 'business',
 *   limit: 100
 * });
 * ```
 */
export function useSpatialSearchByBounds(options: UseSpatialSearchByBoundsOptions) {
  return useQuery({
    queryKey: [
      'spatial-search',
      'bounds',
      options.entityType,
      options.bounds.west,
      options.bounds.south,
      options.bounds.east,
      options.bounds.north,
      options.locationId,
      options.limit,
    ],
    queryFn: async (): Promise<SpatialSearchResult[]> => {
      return await spatialSearchService.searchByBounds({
        bounds: options.bounds,
        entityType: options.entityType,
        locationId: options.locationId,
        limit: options.limit,
      });
    },
    enabled: options.enabled !== false,
    staleTime: 1000 * 60 * 2, // 2 minutos (viewport muda frequentemente)
  });
}

// ============================================
// BUSCA HÍBRIDA
// ============================================

export interface UseSpatialSearchHybridOptions {
  center: { latitude: number; longitude: number };
  radiusKm: number;
  entityType: EntityType;
  locationIds?: string[];
  limit?: number;
  enabled?: boolean;
}

/**
 * Hook para busca híbrida (raio + território)
 * 
 * Entidades dentro do território aparecem primeiro, seguidas por proximidade.
 * 
 * @example
 * ```tsx
 * const { data: results } = useSpatialSearchHybrid({
 *   center: userLocation,
 *   radiusKm: 5,
 *   entityType: 'business',
 *   locationIds: ['loc-pituba', 'loc-barra'],
 *   limit: 30
 * });
 * ```
 */
export function useSpatialSearchHybrid(options: UseSpatialSearchHybridOptions) {
  return useQuery({
    queryKey: [
      'spatial-search',
      'hybrid',
      options.entityType,
      options.center.latitude,
      options.center.longitude,
      options.radiusKm,
      options.locationIds,
      options.limit,
    ],
    queryFn: async (): Promise<SpatialSearchResult[]> => {
      return await spatialSearchService.searchHybrid({
        center: options.center,
        radiusKm: options.radiusKm,
        entityType: options.entityType,
        locationIds: options.locationIds,
        limit: options.limit,
      });
    },
    enabled: options.enabled !== false,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

// ============================================
// ENTIDADES PRÓXIMAS
// ============================================

export interface UseNearbyEntitiesOptions {
  userLocation: { latitude: number; longitude: number } | null;
  entityType: EntityType;
  radiusKm?: number;
  locationId?: string;
  limit?: number;
}

/**
 * Hook conveniente para buscar entidades próximas ao usuário
 * 
 * Automaticamente desabilitado se userLocation for null.
 * 
 * @example
 * ```tsx
 * const { coords } = useRobustGeolocation();
 * const { data: nearby } = useNearbyEntities({
 *   userLocation: coords,
 *   entityType: 'business',
 *   radiusKm: 2
 * });
 * ```
 */
export function useNearbyEntities(options: UseNearbyEntitiesOptions) {
  return useSpatialSearchByRadius({
    center: options.userLocation || { latitude: 0, longitude: 0 },
    radiusKm: options.radiusKm || 2,
    entityType: options.entityType,
    locationId: options.locationId,
    limit: options.limit || 20,
    enabled: options.userLocation !== null,
  });
}
