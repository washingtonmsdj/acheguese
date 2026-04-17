import { useEffect, useMemo, useState } from 'react';

import { boundaryService } from '@/core/geospatial';
import { NEIGHBORHOOD_COLORS } from '@/core/maps/providers/MapProvider';

interface UseNeighborhoodBoundsOptions {
  neighborhood?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  neighborhoods?: Array<{ name: string; city: string; state: string }>;
  enabled?: boolean;
}

export interface NamedBounds {
  name: string;
  bounds: [number, number][];
  center: [number, number];
  color: string;
}

interface UseNeighborhoodBoundsResult {
  bounds: [number, number][] | null;
  namedBounds: NamedBounds[];
  center: [number, number];
  postalCodeBounds: { center: [number, number]; radius: number } | null;
  isLoading: boolean;
  error: Error | null;
}

export function useNeighborhoodBounds({
  neighborhood,
  city,
  state,
  postalCode,
  neighborhoods,
  enabled = true,
}: UseNeighborhoodBoundsOptions): UseNeighborhoodBoundsResult {
  const [bounds, setBounds] = useState<[number, number][] | null>(null);
  const [namedBounds, setNamedBounds] = useState<NamedBounds[]>([]);
  const [center, setCenter] = useState<[number, number]>([-12.975, -38.476]);
  const [postalCodeBounds, setPostalCodeBounds] = useState<{ center: [number, number]; radius: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const stableNeighborhoodsKey = useMemo(
    () => neighborhoods?.map((item) => `${item.name}|${item.city}|${item.state}`).join(',') ?? null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [neighborhoods?.length, neighborhoods?.map((item) => item.name).join(',')],
  );

  useEffect(() => {
    if (!enabled) return;

    const fetchBounds = async () => {
      setIsLoading(true);
      setError(null);

      try {
        if (neighborhoods && neighborhoods.length > 0) {
          const results = await Promise.all(
            neighborhoods.map((item) =>
              boundaryService.getNeighborhoodBounds({
                neighborhood: item.name,
                city: item.city,
                state: item.state,
              }),
            ),
          );

          const nextNamedBounds: NamedBounds[] = [];
          const allBounds: [number, number][] = [];
          const validCenters: [number, number][] = [];

          results.forEach((result, index) => {
            validCenters.push(result.center);

            if (result.rings && result.rings.length > 0) {
              result.rings.forEach((ring) => allBounds.push(...ring));
              nextNamedBounds.push({
                name: neighborhoods[index].name,
                bounds: result.rings[0],
                center: result.center,
                color: NEIGHBORHOOD_COLORS[index % NEIGHBORHOOD_COLORS.length],
              });
            }
          });

          setNamedBounds(nextNamedBounds);
          if (allBounds.length > 0) {
            setBounds(allBounds);
          }

          if (validCenters.length > 0) {
            const avgLat = validCenters.reduce((sum, current) => sum + current[0], 0) / validCenters.length;
            const avgLng = validCenters.reduce((sum, current) => sum + current[1], 0) / validCenters.length;
            setCenter([avgLat, avgLng]);
          }
        } else if (neighborhood && city && state) {
          const result = await boundaryService.getNeighborhoodBounds({
            neighborhood,
            city,
            state,
          });

          if (result.rings && result.rings.length > 0) {
            setBounds(result.rings[0]);
            setNamedBounds([
              {
                name: neighborhood,
                bounds: result.rings[0],
                center: result.center,
                color: NEIGHBORHOOD_COLORS[0],
              },
            ]);
          }

          setCenter(result.center);
        } else if (postalCode) {
          const { locationGeocodingService } = await import('@/core/location/services/LocationGeocodingService');
          const result = await locationGeocodingService.lookupPostalCode({ postalCode });

          if (result?.coordinates) {
            const nextPostalCodeBounds = {
              center: [result.coordinates.latitude, result.coordinates.longitude] as [number, number],
              radius: 500,
            };
            setPostalCodeBounds(nextPostalCodeBounds);
            setCenter(nextPostalCodeBounds.center);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Erro ao buscar bounds'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchBounds();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [neighborhood, city, state, postalCode, stableNeighborhoodsKey, enabled]);

  return {
    bounds,
    namedBounds,
    center,
    postalCodeBounds,
    isLoading,
    error,
  };
}
