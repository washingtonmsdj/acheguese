import { useMemo } from 'react';

import { mapEntityProjection } from '@/core/maps';
import { MapLibreAdapter } from '@/core/maps/components/v3/MapLibreAdapter';
import type { TerritoryPolygon } from '@/core/maps/hooks/useTerritoryPolygon';
import { DEFAULT_TILE_STYLE, NEIGHBORHOOD_COLORS } from '@/core/maps/providers/MapProvider';
import type { MapMarker } from '@/core/maps/types/core';
import type { NamedBounds } from '@/core/business/hooks/useNeighborhoodBounds';

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
  center: [number, number];
  neighborhoodBounds?: [number, number][];
  namedBounds?: NamedBounds[];
  postalCodeBounds?: { center: [number, number]; radius: number };
  onBusinessClick?: (id: string) => void;
  className?: string;
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
  const territoryPolygons = useMemo<TerritoryPolygon[]>(() => {
    if (namedBounds && namedBounds.length > 0) {
      return namedBounds.map((bounds, index) => ({
        name: bounds.name,
        coordinates: bounds.bounds,
        center: bounds.center,
        color: bounds.color ?? NEIGHBORHOOD_COLORS[index % NEIGHBORHOOD_COLORS.length],
      }));
    }

    if (neighborhoodBounds && neighborhoodBounds.length > 0) {
      return [
        {
          name: '',
          coordinates: neighborhoodBounds,
          center,
          color: NEIGHBORHOOD_COLORS[0],
        },
      ];
    }

    return [];
  }, [namedBounds, neighborhoodBounds, center]);

  const circle = useMemo(() => {
    if (!postalCodeBounds || territoryPolygons.length > 0) return undefined;
    return { center: postalCodeBounds.center, radiusMeters: postalCodeBounds.radius };
  }, [postalCodeBounds, territoryPolygons]);

  const markers = useMemo<MapMarker[]>(
    () =>
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
      className={className ?? 'h-full w-full overflow-hidden rounded-2xl'}
      controls={
        showControls
          ? {
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
            }
          : undefined
      }
      userLocationMarker={{ enabled: showControls, autoAdd: true }}
    />
  );
}
