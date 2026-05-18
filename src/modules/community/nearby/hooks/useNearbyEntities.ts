/**
 * useNearbyEntities - Hook agregador para busca de entidades próximas
 * 
 * Combina resultados de múltiplos tipos de entidades e ordena por distância.
 * Segue arquitetura SSOT: usa hooks espaciais existentes.
 * 
 * @module features/nearby/hooks
 */

import React from 'react';
import { useSpatialSearchByRadius } from '@/core/geospatial/hooks/useSpatialSearch';

export interface NearbyEntity {
  id: string;
  type: 'business' | 'event' | 'alert' | 'tourist_point';
  name: string;
  distance: number; // metros
  latitude: number;
  longitude: number;
  metadata?: Record<string, unknown>;
}

export interface UseNearbyEntitiesOptions {
  radiusKm: number;
  entityTypes: Array<'business' | 'event' | 'alert' | 'tourist_point'>;
  center: { latitude: number; longitude: number } | null;
  locationId?: string;
  limit?: number;
}

/**
 * Hook agregador para buscar entidades próximas ao usuário
 * 
 * @example
 * ```tsx
 * const { entities, userLocation, isLoading } = useNearbyEntities({
 *   radiusKm: 5,
 *   entityTypes: ['business', 'event'],
 *   limit: 50,
 * });
 * ```
 */
export function useNearbyEntities(options: UseNearbyEntitiesOptions) {
  const center = options.center;

  // Buscar cada tipo de entidade usando hooks SSOT
  const businesses = useSpatialSearchByRadius({
    center: center || { latitude: 0, longitude: 0 },
    radiusKm: options.radiusKm,
    entityType: 'business',
    locationId: options.locationId,
    limit: options.limit,
    enabled: !!center && options.entityTypes.includes('business'),
  });

  const events = useSpatialSearchByRadius({
    center: center || { latitude: 0, longitude: 0 },
    radiusKm: options.radiusKm,
    entityType: 'event',
    locationId: options.locationId,
    limit: options.limit,
    enabled: !!center && options.entityTypes.includes('event'),
  });

  const alerts = useSpatialSearchByRadius({
    center: center || { latitude: 0, longitude: 0 },
    radiusKm: options.radiusKm,
    entityType: 'alert',
    locationId: options.locationId,
    limit: options.limit,
    enabled: !!center && options.entityTypes.includes('alert'),
  });

  const touristPoints = useSpatialSearchByRadius({
    center: center || { latitude: 0, longitude: 0 },
    radiusKm: options.radiusKm,
    entityType: 'tourist_point',
    locationId: options.locationId,
    limit: options.limit,
    enabled: !!center && options.entityTypes.includes('tourist_point'),
  });

  // Agregar e ordenar por distância
  const entities = React.useMemo(() => {
    const all: NearbyEntity[] = [];

    if (businesses.data) {
      all.push(...businesses.data.map(b => ({
        id: b.id,
        type: 'business' as const,
        name: b.name,
        distance: b.distance_meters,
        latitude: b.latitude,
        longitude: b.longitude,
        metadata: b as unknown as Record<string, unknown>,
      })));
    }

    if (events.data) {
      all.push(...events.data.map(e => ({
        id: e.id,
        type: 'event' as const,
        name: e.name,
        distance: e.distance_meters,
        latitude: e.latitude,
        longitude: e.longitude,
        metadata: e as unknown as Record<string, unknown>,
      })));
    }

    if (alerts.data) {
      all.push(...alerts.data.map(a => ({
        id: a.id,
        type: 'alert' as const,
        name: a.name,
        distance: a.distance_meters,
        latitude: a.latitude,
        longitude: a.longitude,
        metadata: a as unknown as Record<string, unknown>,
      })));
    }

    if (touristPoints.data) {
      all.push(...touristPoints.data.map(t => ({
        id: t.id,
        type: 'tourist_point' as const,
        name: t.name,
        distance: t.distance_meters,
        latitude: t.latitude,
        longitude: t.longitude,
        metadata: t as unknown as Record<string, unknown>,
      })));
    }

    // Ordenar por distância (mais próximo primeiro)
    return all.sort((a, b) => a.distance - b.distance);
  }, [businesses.data, events.data, alerts.data, touristPoints.data]);

  return {
    entities,
    isLoading: businesses.isLoading || events.isLoading || alerts.isLoading || touristPoints.isLoading,
    isError: businesses.isError || events.isError || alerts.isError || touristPoints.isError,
  };
}
