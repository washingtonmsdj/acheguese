/**
 * useNeighborhoodBounds - Hook para buscar limites de bairro
 * Usa GeocodingService para buscar polígonos via Nominatim
 */

import { useState, useEffect, useMemo } from 'react';
import { boundaryService } from '@/core/geospatial';
import { NEIGHBORHOOD_COLORS } from '@/core/maps/providers/MapProvider';

interface UseNeighborhoodBoundsOptions {
  neighborhood?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  /** Para grupos: lista de bairros membros para buscar com cores individuais */
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

  // Estabiliza a referência do array para evitar re-fetches infinitos.
  // Serializa apenas os campos relevantes para comparação.
  const stableNeighborhoodsKey = useMemo(
    () => neighborhoods?.map((n) => `${n.name}|${n.city}|${n.state}`).join(',') ?? null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [neighborhoods?.length, neighborhoods?.map((n) => n.name).join(',')],
  );

  useEffect(() => {
    if (!enabled) return;

    const fetchBounds = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Prioridade 1: Múltiplos bairros (grupo territorial) — cada um com cor própria
        if (neighborhoods && neighborhoods.length > 0) {
          const results = await Promise.all(
            neighborhoods.map(n => boundaryService.getNeighborhoodBounds({
              neighborhood: n.name,
              city: n.city,
              state: n.state,
            }))
          );

          const named: NamedBounds[] = [];
          const allBounds: [number, number][] = [];
          const validCenters: [number, number][] = [];

          results.forEach((r, i) => {
            validCenters.push(r.center);
            if (r.rings && r.rings.length > 0) {
              r.rings.forEach(ring => allBounds.push(...ring));
              named.push({
                name: neighborhoods[i].name,
                bounds: r.rings[0],
                center: r.center,
                color: NEIGHBORHOOD_COLORS[i % NEIGHBORHOOD_COLORS.length],
              });
            }
          });

          setNamedBounds(named);
          if (allBounds.length > 0) setBounds(allBounds);

          if (validCenters.length > 0) {
            const avgLat = validCenters.reduce((s, c) => s + c[0], 0) / validCenters.length;
            const avgLng = validCenters.reduce((s, c) => s + c[1], 0) / validCenters.length;
            setCenter([avgLat, avgLng]);
          }
        }
        // Prioridade 2: Bairro único
        else if (neighborhood && city && state) {
          const result = await boundaryService.getNeighborhoodBounds({
            neighborhood,
            city,
            state,
          });
          if (result.rings && result.rings.length > 0) {
            setBounds(result.rings[0]);
          }
          setCenter(result.center);
          if (result.rings && result.rings.length > 0) {
            setNamedBounds([{
              name: neighborhood,
              bounds: result.rings[0],
              center: result.center,
              color: NEIGHBORHOOD_COLORS[0],
            }]);
          }
        }
        // Prioridade 3: CEP - usa geocodingService para lookup
        else if (postalCode) {
          const { locationGeocodingService } = await import('@/core/location/services/LocationGeocodingService');
          const result = await locationGeocodingService.lookupPostalCode({ postalCode });
          if (result?.coordinates) {
            const boundsResult = {
              center: [result.coordinates.latitude, result.coordinates.longitude] as [number, number],
              radius: 500,
            };
            setPostalCodeBounds(boundsResult);
            setCenter(boundsResult.center);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Erro ao buscar bounds'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchBounds();
    // neighborhoods é coberto por stableNeighborhoodsKey para evitar reruns por identidade de array.
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

