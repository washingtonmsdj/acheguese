/**
 * NeighborhoodMap — Mapa interativo de bairro com empresas.
 *
 * Wrapper fino sobre MapLibreAdapter. Toda lógica de busca, localização
 * e marcadores é delegada ao MapLibreAdapter via sistema de controles.
 *
 * Geolocalização: MapLibreAdapter.controls.location → MapLocationControl
 *   → useRobustGeolocation → GeolocationService (SSOT)
 */

import { useMemo } from 'react';
import { NEIGHBORHOOD_COLORS } from '@/core/maps/providers/MapProvider';
import { DEFAULT_TILE_STYLE } from '@/core/maps/providers/MapProvider';
import { MapLibreAdapter } from '@/core/maps/components/v3/MapLibreAdapter';
import { mapEntityProjection } from '@/core/maps';
import type { TerritoryPolygon } from '@/core/maps/hooks/useTerritoryPolygon';
import type { MapMarker } from '@/core/maps/types/core';
import type { NamedBounds } from '../hooks/useNeighborhoodBounds';

/** Projeção mínima de Business para renderização no mapa. */
export interface NeighborhoodBusiness {
  id: string;
  name: string;
  category?: string;
  rating?: number;
  isOpen?: boolean;
  coords: { lat: number; lng: number };
}

export interface NeighborhoodMapProps {
  businesses: NeighborhoodBusiness[];
  /** Centro do mapa em [lat, lng] */
  center: [number, number];
  neighborhoodBounds?: [number, number][];
  namedBounds?: NamedBounds[];
  postalCodeBounds?: { center: [number, number]; radius: number };
  onBusinessClick?: (id: string) => void;
  className?: string;
  /** Mostrar controles de localização e busca (padrão: true) */
  showControls?: boolean;
}

export function NeighborhoodMap({
  businesses,
  center,
  neighborhoodBounds,
  namedBounds,
  postalCodeBounds,
  onBusinessClick,
  className,
  showControls = true,
}: NeighborhoodMapProps) {
  // Converter namedBounds/neighborhoodBounds para TerritoryPolygon (formato v3)
  const territoryPolygons = useMemo<TerritoryPolygon[]>(() => {
    if (namedBounds && namedBounds.length > 0) {
      return namedBounds.map((nb, i) => ({
        name: nb.name,
        coordinates: nb.bounds,
        center: nb.center,
        color: nb.color ?? NEIGHBORHOOD_COLORS[i % NEIGHBORHOOD_COLORS.length],
      }));
    }
    if (neighborhoodBounds && neighborhoodBounds.length > 0) {
      return [{ name: '', coordinates: neighborhoodBounds, center, color: NEIGHBORHOOD_COLORS[0] }];
    }
    return [];
  }, [namedBounds, neighborhoodBounds, center]);

  // Área circular (CEP) — só quando não há polígonos
  const circle = useMemo(() => {
    if (!postalCodeBounds || territoryPolygons.length > 0) return undefined;
    return { center: postalCodeBounds.center, radiusMeters: postalCodeBounds.radius };
  }, [postalCodeBounds, territoryPolygons]);

  const markers = useMemo<MapMarker[]>(() =>
    businesses
      .map((business) =>
        mapEntityProjection.projectEntity(
          {
            id: business.id,
            name: business.name,
            latitude: business.coords.lat,
            longitude: business.coords.lng,
            status: business.isOpen ? 'active' : 'inactive',
            category: business.category,
            rating: business.rating,
          },
          'business',
          { includeMetadata: true },
        ),
      )
      .filter((marker): marker is MapMarker => marker !== null),
    [businesses],
  );

  return (
    <MapLibreAdapter
      styleUrl={DEFAULT_TILE_STYLE.styleUrl}
      initialViewport={{ center: { latitude: center[0], longitude: center[1] }, zoom: 14 }}
      territoryPolygons={territoryPolygons}
      markers={markers}
      onMarkerClick={onBusinessClick}
      circle={circle}
      className={className ?? 'w-full h-full rounded-2xl overflow-hidden'}
      controls={showControls ? {
        search: {
          type: 'entity-filter',
          position: 'top-left',
          placeholder: 'Buscar empresas...',
        },
        location: {
          enabled: true,
          position: 'top-right',
          showAccuracy: true,
          autoFlyTo: true,
        },
      } : undefined}
      userLocationMarker={{ enabled: showControls, autoAdd: true }}
    />
  );
}
