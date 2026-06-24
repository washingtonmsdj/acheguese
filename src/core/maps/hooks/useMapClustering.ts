/**
 * useMapClustering - Hook para clustering de marcadores no mapa
 * 
 * Gerencia clustering automático baseado em zoom e viewport.
 * 
 * @module core/maps/hooks
 */

import { useMemo, useEffect, useState } from 'react';
import { clusteringService } from '../services/ClusteringService';
import type { MapMarker, BoundingBox } from '../types/core';
import type { ClusterPoint } from '../services/ClusteringService';

export interface UseMapClusteringOptions {
  markers: MapMarker[];
  bounds: BoundingBox | null;
  zoom: number;
  enabled?: boolean;
  radius?: number;
  maxZoom?: number;
  minPoints?: number;
}

export interface UseMapClusteringResult {
  clusters: ClusterPoint[];
  isReady: boolean;
}

function hasFiniteCoordinates(marker: MapMarker): boolean {
  return Number.isFinite(marker.coordinates?.latitude) && Number.isFinite(marker.coordinates?.longitude);
}

/**
 * Hook para clustering de marcadores no mapa
 * 
 * @example
 * ```tsx
 * const { clusters, isReady } = useMapClustering({
 *   markers: allMarkers,
 *   bounds: mapBounds,
 *   zoom: mapZoom,
 *   enabled: true
 * });
 * 
 * // Renderizar clusters no mapa
 * clusters.forEach(cluster => {
 *   if (cluster.properties.cluster) {
 *     // Renderizar cluster
 *     renderCluster(cluster);
 *   } else {
 *     // Renderizar marcador individual
 *     renderMarker(cluster.properties.marker);
 *   }
 * });
 * ```
 */
export function useMapClustering(options: UseMapClusteringOptions): UseMapClusteringResult {
  const {
    markers,
    bounds,
    zoom,
    enabled = true,
    radius = 60,
    maxZoom = 16,
    minPoints = 2,
  } = options;

  const [isReady, setIsReady] = useState(false);

  // Carregar marcadores no clustering quando mudarem
  useEffect(() => {
    if (!enabled || markers.length === 0) {
      clusteringService.clear();
      setIsReady(false);
      return;
    }

    clusteringService.load(markers, {
      radius,
      maxZoom,
      minPoints,
    });

    setIsReady(true);
  }, [markers, enabled, radius, maxZoom, minPoints]);

  // Obter clusters para o viewport atual
  const clusters = useMemo(() => {
    if (!enabled || !isReady || !bounds) {
      // Retornar marcadores individuais sem clustering
      // ✅ SSOT: Filtrar marcadores com coordenadas válidas
      return markers
        .filter(hasFiniteCoordinates)
        .map((marker, index) => ({
          type: 'Feature' as const,
          id: index,
          properties: {
            cluster: false,
            marker,
          },
          geometry: {
            type: 'Point' as const,
            coordinates: [
              marker.coordinates.longitude,
              marker.coordinates.latitude,
            ] as [number, number],
          },
        }));
    }

    return clusteringService.getClusters(bounds, zoom);
  }, [enabled, isReady, bounds, zoom, markers]);

  return {
    clusters,
    isReady,
  };
}

