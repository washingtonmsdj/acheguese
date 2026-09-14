/**
 * useTerritoryPolygon — Busca o polígono geográfico do território ativo.
 *
 * O serviço de boundary é carregado sob demanda para não bloquear o primeiro
 * render de mapas que podem exibir o basemap antes da geometria oficial.
 */

import { useEffect, useState } from "react";
import { NEIGHBORHOOD_COLORS } from "../providers/MapProvider";
import type { ResolvedTerritory } from "@/core/routing/hooks/useResolveTerritoryFromUrl";

export interface TerritoryPolygon {
  name: string;
  coordinates: [number, number][];
  center: [number, number];
  color: string;
  fillOpacity?: number;
  lineWidth?: number;
  lineOpacity?: number;
}

interface UseTerritoryPolygonResult {
  polygons: TerritoryPolygon[];
  isLoading: boolean;
}

interface CachedTerritoryPolygons {
  loadedAt: number;
  polygons: TerritoryPolygon[];
}

const POLYGON_CACHE_TTL_MS = 5 * 60 * 1000;
const polygonCache = new Map<string, CachedTerritoryPolygons>();
const polygonPromises = new Map<string, Promise<TerritoryPolygon[]>>();

function parseGeoPath(
  geoPath: string,
): { neighborhood: string | null; city: string; state: string } | null {
  const parts = geoPath.split("/").filter(Boolean);
  if (parts.length === 3) {
    return {
      state: parts[1],
      city: parts[2].replace(/-/g, " "),
      neighborhood: null,
    };
  }
  if (parts.length >= 4) {
    return {
      state: parts[1],
      city: parts[2],
      neighborhood: parts[3].replace(/-/g, " "),
    };
  }
  return null;
}

function getTerritoryKey(
  resolved: ResolvedTerritory | null | undefined,
): string | null {
  if (!resolved) return null;
  return resolved.kind === "location"
    ? `location:${resolved.location.id}`
    : `group:${resolved.group.id}`;
}

function getCachedPolygons(key: string | null): TerritoryPolygon[] | null {
  if (!key) return null;
  const cached = polygonCache.get(key);
  if (!cached) return null;
  if (Date.now() - cached.loadedAt > POLYGON_CACHE_TTL_MS) {
    polygonCache.delete(key);
    return null;
  }
  return cached.polygons;
}

function isCompleteBoundary(
  resolved: ResolvedTerritory,
  polygons: TerritoryPolygon[],
): boolean {
  if (!resolved) return false;
  if (resolved.kind === "location") return polygons.length > 0;
  if (resolved.group.members.length === 0) return false;
  const names = new Set(polygons.map((polygon) => polygon.name));
  return resolved.group.members.every((member) => names.has(member.name));
}

async function fetchTerritoryPolygons(
  resolved: ResolvedTerritory,
): Promise<TerritoryPolygon[]> {
  if (!resolved) return [];

  const { boundaryService } = await import(
    "@/core/geospatial/services/BoundaryService"
  );

  if (resolved.kind === "location") {
    const result = await boundaryService.getLocationBounds(resolved.location);
    return result.rings.map((ring, index) => ({
      name: resolved.location.name,
      coordinates: ring,
      center: result.center,
      color: NEIGHBORHOOD_COLORS[index % NEIGHBORHOOD_COLORS.length],
    }));
  }

  const results = await Promise.all(
    resolved.group.members.map((member) => {
      const parsed = parseGeoPath(member.geographic_path);
      if (!parsed) return Promise.resolve(null);
      return boundaryService
        .getLocationBounds(member)
        .then((result) => ({ member, result }));
    }),
  );

  const built: TerritoryPolygon[] = [];
  results.forEach((item, memberIndex) => {
    if (!item || item.result.rings.length === 0) return;
    const color = NEIGHBORHOOD_COLORS[memberIndex % NEIGHBORHOOD_COLORS.length];
    item.result.rings.forEach((ring) => {
      built.push({
        name: item.member.name,
        coordinates: ring,
        center: item.result.center,
        color,
      });
    });
  });

  return built;
}

async function loadTerritoryPolygons(
  resolved: ResolvedTerritory,
): Promise<TerritoryPolygon[]> {
  const territoryKey = getTerritoryKey(resolved);
  if (!territoryKey || !resolved) return [];

  const cached = getCachedPolygons(territoryKey);
  if (cached) return cached;

  const pending = polygonPromises.get(territoryKey);
  if (pending) return pending;

  const promise = fetchTerritoryPolygons(resolved)
    .then((polygons) => {
      if (isCompleteBoundary(resolved, polygons)) {
        polygonCache.set(territoryKey, {
          loadedAt: Date.now(),
          polygons,
        });
      }
      return polygons;
    })
    .finally(() => {
      polygonPromises.delete(territoryKey);
    });

  polygonPromises.set(territoryKey, promise);
  return promise;
}

/**
 * Aquece a geometria territorial sem montar UI. O hook reutiliza a mesma
 * promessa/cache, evitando uma segunda consulta se montar durante o preload.
 */
export function preloadTerritoryPolygons(
  resolved: ResolvedTerritory | null | undefined,
): Promise<void> {
  if (!resolved) return Promise.resolve();
  return loadTerritoryPolygons(resolved).then(() => undefined).catch(() => undefined);
}

export function useTerritoryPolygon(
  resolved: ResolvedTerritory | null | undefined,
  options: { enabled?: boolean } = {},
): UseTerritoryPolygonResult {
  const territoryKey = getTerritoryKey(resolved);
  const [polygonState, setPolygonState] = useState<{
    territoryKey: string | null;
    polygons: TerritoryPolygon[];
  }>(() => {
    const cached = getCachedPolygons(territoryKey);
    return cached
      ? { territoryKey, polygons: cached }
      : { territoryKey: null, polygons: [] };
  });
  const [isLoading, setIsLoading] = useState(() =>
    Boolean(resolved && options.enabled !== false && !getCachedPolygons(territoryKey)),
  );

  useEffect(() => {
    if (!resolved || options.enabled === false) {
      setPolygonState({ territoryKey: null, polygons: [] });
      setIsLoading(false);
      return;
    }

    const cached = getCachedPolygons(territoryKey);
    if (cached) {
      setPolygonState({ territoryKey, polygons: cached });
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setPolygonState({ territoryKey: null, polygons: [] });
    setIsLoading(true);

    void loadTerritoryPolygons(resolved)
      .then((polygons) => {
        if (cancelled) return;
        setPolygonState({ territoryKey, polygons });
      })
      .catch(() => {
        if (cancelled) return;
        setPolygonState({ territoryKey, polygons: [] });
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [options.enabled, resolved, territoryKey]);

  return {
    polygons:
      polygonState.territoryKey === territoryKey ? polygonState.polygons : [],
    isLoading,
  };
}
