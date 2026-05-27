import { useCallback, useRef } from 'react';
import type { MapViewport } from '../../types/core';
import { MAP_DEFAULT_COORDINATES } from '../../config/defaultCoordinates';

/**
 * Hook para sincronizar viewport do MapLibreAdapter com o estado interno.
 * Mantém a última posição conhecida do mapa.
 */
export function useViewportBridge() {
  const viewportRef = useRef<MapViewport>({
    center: MAP_DEFAULT_COORDINATES,
    zoom: 13,
  });

  const handleMapMove = useCallback((newViewport: Partial<MapViewport>) => {
    viewportRef.current = { ...viewportRef.current, ...newViewport };
  }, []);

  return {
    currentViewport: viewportRef.current,
    handleMapMove,
  };
}
