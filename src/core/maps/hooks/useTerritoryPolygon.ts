/**
 * useTerritoryPolygon — Busca o polígono geográfico do território ativo.
 *
 * O serviço de boundary é carregado sob demanda para não bloquear o primeiro
 * render de mapas que podem exibir o basemap antes da geometria oficial.
 */

import { useState, useEffect } from "react";
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

export function useTerritoryPolygon(
  resolved: ResolvedTerritory | null | undefined,
  options: { enabled?: boolean } = {},
): UseTerritoryPolygonResult {
  const territoryKey = resolved
    ? resolved.kind === "location"
      ? `location:${resolved.location.id}`
      : `group:${resolved.group.id}`
    : null;
  const [polygonState, setPolygonState] = useState<{
    territoryKey: string | null;
    polygons: TerritoryPolygon[];
  }>({ territoryKey: null, polygons: [] });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!resolved || options.enabled === false) {
      setPolygonState({ territoryKey: null, polygons: [] });
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const fetch = async () => {
      setPolygonState({ territoryKey: null, polygons: [] });
      setIsLoading(true);

      try {
        const { boundaryService } = await import(
          "@/core/geospatial/services/BoundaryService"
        );

        if (cancelled) return;

        if (resolved.kind === "location") {
          const result = await boundaryService.getLocationBounds(resolved.location);
          if (cancelled) return;

          setPolygonState({
            territoryKey,
            polygons: result.rings.map((ring, i) => ({
              name: resolved.location.name,
              coordinates: ring,
              center: result.center,
              color: NEIGHBORHOOD_COLORS[i % NEIGHBORHOOD_COLORS.length],
            })),
          });
          return;
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

        if (cancelled) return;

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
        setPolygonState({ territoryKey, polygons: built });
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void fetch();
    return () => {
      cancelled = true;
    };
  }, [options.enabled, resolved, territoryKey]);

  return {
    polygons: polygonState.territoryKey === territoryKey ? polygonState.polygons : [],
    isLoading,
  };
}
