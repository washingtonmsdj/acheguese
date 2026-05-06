/**
 * useCityNeighborhoodsPolygons
 *
 * Busca os polígonos de todos os bairros ativos de uma cidade.
 * Só executa quando `enabled` é true — evita chamadas desnecessárias.
 *
 * Fluxo:
 *   1. Busca os filhos diretos da cidade (type=district, status=active)
 *   2. Para cada bairro, busca o boundary canônico via SSOT territorial
 *   3. Retorna um TerritoryPolygon[] com todos os anéis encontrados
 *
 * @module core/maps/hooks
 */
import { logger } from '@/shared/utils/logger';
import { useState, useEffect, useRef } from 'react';
import { createLocationRepository } from '@/core/location/repositories/createLocationRepository';
import { boundaryService } from '@/core/geospatial';
import { NEIGHBORHOOD_COLORS } from '../providers/MapProvider';
import type { TerritoryPolygon } from './useTerritoryPolygon';
import type { Location } from '@/core/location/types';
import { LocationType, LocationStatus } from '@/core/location/types';

interface UseCityNeighborhoodsPolygonsOptions {
  /** ID da cidade no banco */
  cityId: string | null | undefined;
  /** Path geográfico da cidade, ex: /br/ba/salvador */
  cityGeoPath: string | null | undefined;
  /** Ativa ou desativa a busca */
  enabled: boolean;
}

interface UseCityNeighborhoodsPolygonsResult {
  polygons: TerritoryPolygon[];
  isLoading: boolean;
}

// Cache key para localStorage
const CACHE_KEY_PREFIX = 'city-neighborhoods-cache-';
const CACHE_VERSION = 'v1';
const CACHE_EXPIRY_DAYS = 7; // Cache válido por 7 dias

interface CachedData {
  version: string;
  timestamp: number;
  polygons: TerritoryPolygon[];
}

function getCacheKey(cityId: string): string {
  return `${CACHE_KEY_PREFIX}${CACHE_VERSION}-${cityId}`;
}

function loadFromCache(cityId: string): TerritoryPolygon[] | null {
  try {
    const key = getCacheKey(cityId);
    const cached = localStorage.getItem(key);
    if (!cached) return null;

    const data: CachedData = JSON.parse(cached);

    if (data.version !== CACHE_VERSION) return null;

    const now = Date.now();
    const expiryMs = CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
    if (now - data.timestamp > expiryMs) {
      localStorage.removeItem(key);
      return null;
    }

    return data.polygons;
  } catch {
    return null;
  }
}

function saveToCache(cityId: string, polygons: TerritoryPolygon[]): void {
  try {
    const key = getCacheKey(cityId);
    const data: CachedData = {
      version: CACHE_VERSION,
      timestamp: Date.now(),
      polygons,
    };
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    logger.warn('[useCityNeighborhoodsPolygons] Failed to save to cache:', error);
  }
}

/**
 * Limpa o cache de uma cidade específica ou de todas as cidades.
 * Útil para forçar re-fetch quando os dados mudam.
 */
export function clearNeighborhoodsCache(cityId?: string): void {
  try {
    if (cityId) {
      const key = getCacheKey(cityId);
      localStorage.removeItem(key);
    } else {
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith(CACHE_KEY_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    }
  } catch (error) {
    logger.warn('[useCityNeighborhoodsPolygons] Failed to clear cache:', error);
  }
}

export function useCityNeighborhoodsPolygons({
  cityId,
  cityGeoPath,
  enabled,
}: UseCityNeighborhoodsPolygonsOptions): UseCityNeighborhoodsPolygonsResult {
  const [polygons, setPolygons] = useState<TerritoryPolygon[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const cacheRef = useRef<Map<string, TerritoryPolygon[]>>(new Map());

  useEffect(() => {
    if (!enabled || !cityId || !cityGeoPath) {
      setPolygons([]);
      return;
    }

    if (cacheRef.current.has(cityId)) {
      setPolygons(cacheRef.current.get(cityId)!);
      return;
    }

    const cachedPolygons = loadFromCache(cityId);
    if (cachedPolygons) {
      cacheRef.current.set(cityId, cachedPolygons);
      setPolygons(cachedPolygons);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    const run = async () => {
      try {
        const repo = createLocationRepository();
        const { locations: neighborhoods } = await repo.findChildren(cityId, {
          type: LocationType.DISTRICT,
          status: LocationStatus.ACTIVE,
          page_size: 200,
        });

        if (cancelled) return;

        const results = await Promise.allSettled(
          neighborhoods.map((neighborhood: Location) =>
            boundaryService
              .getNeighborhoodBounds({
                neighborhood: neighborhood.name,
                city: '',
                state: '',
                locationId: neighborhood.id,
              })
              .then((result) => ({ neighborhood, result })),
          ),
        );

        if (cancelled) return;

        const built: TerritoryPolygon[] = [];
        let successCount = 0;
        let failureCount = 0;
        const unresolvedNeighborhoods: string[] = [];

        results.forEach((settled, index) => {
          if (settled.status !== 'fulfilled') {
            failureCount++;
            unresolvedNeighborhoods.push(neighborhoods[index].name);
            return;
          }

          const { neighborhood, result } = settled.value;
          if (result.rings.length === 0) {
            failureCount++;
            unresolvedNeighborhoods.push(neighborhood.name);
            return;
          }

          successCount++;
          const color = NEIGHBORHOOD_COLORS[index % NEIGHBORHOOD_COLORS.length];
          result.rings.forEach((ring) => {
            built.push({
              name: neighborhood.name,
              coordinates: ring,
              center: result.center,
              color,
            });
          });
        });

        if (failureCount > 0) {
          logger.warn('[useCityNeighborhoodsPolygons] Neighborhoods without stored boundary', {
            cityId,
            successCount,
            failureCount,
            unresolvedNeighborhoods,
          });
        }

        cacheRef.current.set(cityId, built);
        saveToCache(cityId, built);

        if (!cancelled) setPolygons(built);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    run();
    return () => { cancelled = true; };
  }, [enabled, cityId, cityGeoPath]);

  return { polygons, isLoading };
}

if (typeof window !== 'undefined') {
  (window as any).clearNeighborhoodsCache = clearNeighborhoodsCache;
}

