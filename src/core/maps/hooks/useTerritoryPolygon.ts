/**
 * useTerritoryPolygon — Busca o polígono geográfico do território ativo.
 *
 * Usa GeocodingService (Nominatim via proxy Supabase) para obter o polígono
 * do bairro ou cidade resolvido pelo useTerritoryFilter.
 *
 * Retorna coordenadas no formato [lat, lng] (padrão interno do projeto).
 * O MapLibreAdapter converte para [lng, lat] ao renderizar.
 *
 * @module core/maps/hooks
 */

import { useState, useEffect } from "react";
import { boundaryService } from "@/core/geospatial";
import { NEIGHBORHOOD_COLORS } from "../providers/MapProvider";
import type { ResolvedTerritory } from "@/core/routing/hooks/useResolveTerritoryFromUrl";

export interface TerritoryPolygon {
  /** Nome do território */
  name: string;
  /** Coordenadas do polígono em [lat, lng] */
  coordinates: [number, number][];
  /** Centro do polígono em [lat, lng] */
  center: [number, number];
  /** Cor de destaque */
  color: string;
  /** Opacidade do preenchimento da camada */
  fillOpacity?: number;
  /** Largura da linha da camada */
  lineWidth?: number;
  /** Opacidade da linha da camada */
  lineOpacity?: number;
}

interface UseTerritoryPolygonResult {
  /** Polígonos do território ativo (um por bairro em grupos) */
  polygons: TerritoryPolygon[];
  isLoading: boolean;
}

/**
 * Extrai nome de bairro e cidade de um geographic_path.
 * Ex: /br/ba/salvador/nordeste-de-amaralina → { neighborhood: 'nordeste-de-amaralina', city: 'salvador', state: 'ba' }
 * Ex: /br/ba/salvador → { neighborhood: null, city: 'salvador', state: 'ba' }
 */
function parseGeoPath(
  geoPath: string,
): { neighborhood: string | null; city: string; state: string } | null {
  const parts = geoPath.split("/").filter(Boolean);
  // /br/state/city → 3 partes (cidade)
  if (parts.length === 3) {
    return {
      state: parts[1],
      city: parts[2].replace(/-/g, " "),
      neighborhood: null,
    };
  }
  // /br/state/city/district → 4 partes (bairro)
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
      // Não mantenha o contorno anterior enquanto o novo território resolve:
      // isso evitaria rotular Salvador como se fosse o bairro selecionado.
      setPolygonState({ territoryKey: null, polygons: [] });
      setIsLoading(true);

      try {
        if (resolved.kind === "location") {
          const result = await boundaryService.getLocationBounds(
            resolved.location,
          );

          if (cancelled) return;

          // Um TerritoryPolygon por anel — suporta Polygon e MultiPolygon corretamente
          setPolygonState({
            territoryKey,
            polygons: result.rings.map((ring, i) => ({
              name: resolved.location.name,
              coordinates: ring,
              center: result.center,
              color: NEIGHBORHOOD_COLORS[i % NEIGHBORHOOD_COLORS.length],
            })),
          });
        } else if (resolved.kind === "group") {
          // Grupo: buscar polígono de cada membro
          const members = resolved.group.members;
          const results = await Promise.all(
            members.map((m) => {
              const parsed = parseGeoPath(m.geographic_path);
              if (!parsed) return Promise.resolve(null);
              return boundaryService
                .getLocationBounds(m)
                .then((r) => ({ member: m, result: r }));
            }),
          );

          if (cancelled) return;

          const built: TerritoryPolygon[] = [];
          results.forEach((r, memberIdx) => {
            if (!r || r.result.rings.length === 0) return;
            const color =
              NEIGHBORHOOD_COLORS[memberIdx % NEIGHBORHOOD_COLORS.length];
            r.result.rings.forEach((ring) => {
              built.push({
                name: r.member.name,
                coordinates: ring,
                center: r.result.center,
                color,
              });
            });
          });
          setPolygonState({ territoryKey, polygons: built });
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetch();
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
