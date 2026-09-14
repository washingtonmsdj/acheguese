/**
 * useTerritoryPolygon — Busca o polígono geográfico do território ativo.
 *
 * A fonte oficial declarada no próprio Location é tentada primeiro por um
 * loader leve/batch. O BoundaryService completo só entra quando essa fonte não
 * atende o território, mantendo Supabase e repositórios fora do caminho feliz
 * da entrada pública.
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
const POLYGON_LOAD_TIMEOUT_MS = 12_000;
const polygonCache = new Map<string, CachedTerritoryPolygons>();
const polygonPromises = new Map<string, Promise<TerritoryPolygon[]>>();

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

function withPolygonLoadTimeout<T>(promise: Promise<T>): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(
      () => reject(new Error("territory_polygon_timeout")),
      POLYGON_LOAD_TIMEOUT_MS,
    );
  });

  return Promise.race([promise, timeout]).finally(() => {
    if (timeoutId !== null) clearTimeout(timeoutId);
  });
}

async function fetchOfficialSourcePolygons(
  resolved: ResolvedTerritory,
): Promise<TerritoryPolygon[] | null> {
  if (!resolved) return null;

  const { loadOfficialFeatureServerBoundaries } = await import(
    "@/core/geospatial/data/officialFeatureServerBoundary"
  );
  const locations =
    resolved.kind === "location" ? [resolved.location] : resolved.group.members;
  const official = await loadOfficialFeatureServerBoundaries(locations);

  if (resolved.kind === "location") {
    const result = official.get(resolved.location.id);
    if (!result) return null;

    return result.rings.map((ring, index) => ({
      name: resolved.location.name,
      coordinates: ring,
      center: result.center,
      color: NEIGHBORHOOD_COLORS[index % NEIGHBORHOOD_COLORS.length],
    }));
  }

  if (
    resolved.group.members.length === 0 ||
    !resolved.group.members.every((member) => official.has(member.id))
  ) {
    return null;
  }

  const built: TerritoryPolygon[] = [];
  resolved.group.members.forEach((member, memberIndex) => {
    const result = official.get(member.id);
    if (!result) return;
    const color = NEIGHBORHOOD_COLORS[memberIndex % NEIGHBORHOOD_COLORS.length];
    result.rings.forEach((ring) => {
      built.push({
        name: member.name,
        coordinates: ring,
        center: result.center,
        color,
      });
    });
  });

  return built;
}

async function fetchBoundaryServicePolygons(
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
    resolved.group.members.map((member) =>
      boundaryService
        .getLocationBounds(member)
        .then((result) => ({ member, result })),
    ),
  );

  const built: TerritoryPolygon[] = [];
  results.forEach((item, memberIndex) => {
    if (item.result.rings.length === 0) return;
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

async function fetchTerritoryPolygons(
  resolved: ResolvedTerritory,
): Promise<TerritoryPolygon[]> {
  if (!resolved) return [];

  const officialPolygons = await fetchOfficialSourcePolygons(resolved).catch(
    () => null,
  );
  if (
    officialPolygons &&
    isCompleteBoundary(resolved, officialPolygons)
  ) {
    return officialPolygons;
  }

  return fetchBoundaryServicePolygons(resolved);
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

  const promise = withPolygonLoadTimeout(fetchTerritoryPolygons(resolved))
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
