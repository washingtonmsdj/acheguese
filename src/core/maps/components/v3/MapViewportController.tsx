/**
 * MapViewportController / useViewportBridge
 *
 * useViewportBridge: hook usado pelo MapLibreAdapter para sincronizar
 * o viewport interno com o mapa MapLibre.
 *
 * @module core/maps/components/v3
 */

import React, { useCallback, useRef } from 'react';
import type { MapViewport } from '../../types/core';
import { MAP_DEFAULT_COORDINATES } from '../../config/defaultCoordinates';

export interface MapViewportControllerProps {
  onViewportChange: (viewport: MapViewport) => void;
  externalViewport?: Partial<MapViewport>;
  children?: React.ReactNode;
}

/** @deprecated Não usado em produção — o MapLibreAdapter gerencia viewport diretamente */
export function MapViewportController({ children }: MapViewportControllerProps) {
  return <>{children}</>;
}

/**
 * Hook para sincronizar viewport do MapLibreAdapter com o estado interno.
 * Mantém a última posição conhecida do mapa.
 */
// eslint-disable-next-line react-refresh/only-export-components
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
