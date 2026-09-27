/**
 * useResolveTerritoryFromUrl
 *
 * Resolves the public territory exclusively from the canonical territory URL.
 *
 * Canonical patterns:
 *   /:state/:city
 *   /:state/:city/:territorySlug
 *   /:state/:city/:module
 *   /:state/:city/:territorySlug/:module
 *
 * A territorySlug may identify either a public Location below the city or an
 * active TerritorialGroup anchored in that city. Product modules (including
 * Community) consume this result; they never participate in territory identity
 * resolution.
 */

import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";

import { createLocationRepository } from "@/core/location/repositories/createLocationRepository";
import { TERRITORY_CONFIG } from "@/core/routing/config/territory";
import { territorialGroupService } from "@/core/territorial";

import type { ResolvedTerritory } from "../types/territoryResolution";
import { parsePublicTerritoryPath } from "../utils/publicTerritoryPath";
import { resolvePublicTerritoryFallback } from "../utils/publicTerritoryFallbacks";
import { isTerritoryPubliclyNavigable } from "../utils/territoryVisibility";

export const TERRITORY_RESOLVE_STATUS = {
  IDLE: "idle",
  LOADING: "loading",
  RESOLVED_LOCATION: "resolved_location",
  RESOLVED_GROUP: "resolved_group",
  NOT_FOUND: "not_found",
  INACTIVE: "inactive",
  RESTRICTED: "restricted",
  ERROR: "error",
} as const;

export type TerritoryResolveStatus =
  (typeof TERRITORY_RESOLVE_STATUS)[keyof typeof TERRITORY_RESOLVE_STATUS];

export type { ResolvedTerritory } from "../types/territoryResolution";

export interface TerritoryResolveResult {
  status: TerritoryResolveStatus;
  resolved: ResolvedTerritory;
  error: string | null;
}

const RESOLVE_TIMEOUT_MS = 6000;

function createResolvedFallbackResult(
  fallback: ResolvedTerritory,
): TerritoryResolveResult | null {
  if (!fallback) return null;

  return {
    status:
      fallback.kind === "group"
        ? TERRITORY_RESOLVE_STATUS.RESOLVED_GROUP
        : TERRITORY_RESOLVE_STATUS.RESOLVED_LOCATION,
    resolved: fallback,
    error: null,
  };
}

function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs = RESOLVE_TIMEOUT_MS,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error(`Territory resolution timeout after ${timeoutMs}ms`));
    }, timeoutMs);

    promise.then(
      (value) => {
        window.clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        window.clearTimeout(timer);
        reject(error);
      },
    );
  });
}

export function useResolveTerritoryFromUrl(): TerritoryResolveResult {
  const location = useLocation();
  const params = useParams<{
    country?: string;
    state?: string;
    city?: string;
    territorySlug?: string;
  }>();

  const pathname = location.pathname;
  const parsedPath = parsePublicTerritoryPath(pathname);
  const country = params.country ?? TERRITORY_CONFIG.defaultCountry;
  const state = params.state ?? parsedPath.state;
  const city = params.city ?? parsedPath.city;
  const territorySlug = params.territorySlug ?? parsedPath.territorySlug;

  const [result, setResult] = useState<TerritoryResolveResult>({
    status: TERRITORY_RESOLVE_STATUS.IDLE,
    resolved: null,
    error: null,
  });

  useEffect(() => {
    const fallback = resolvePublicTerritoryFallback({
      state,
      city,
      territorySlug,
    });

    if (!country || !state || !city) {
      const fallbackResult = createResolvedFallbackResult(fallback);
      setResult(
        fallbackResult ?? {
          status: TERRITORY_RESOLVE_STATUS.NOT_FOUND,
          resolved: null,
          error: `Território inválido na URL: ${pathname}`,
        },
      );
      return;
    }

    let cancelled = false;
    setResult({
      status: TERRITORY_RESOLVE_STATUS.LOADING,
      resolved: null,
      error: null,
    });

    const commit = (next: TerritoryResolveResult) => {
      if (!cancelled) setResult(next);
    };

    async function resolveTerritory() {
      try {
        const locationRepo = createLocationRepository();
        const cityPath = `/${country}/${state}/${city}`;
        const cityLocation = await withTimeout(
          locationRepo.findByPath(cityPath),
        );

        if (!cityLocation) {
          commit({
            status: TERRITORY_RESOLVE_STATUS.NOT_FOUND,
            resolved: null,
            error: `Cidade não encontrada: ${cityPath}`,
          });
          return;
        }

        if (cityLocation.status !== "active") {
          commit({
            status: TERRITORY_RESOLVE_STATUS.INACTIVE,
            resolved: null,
            error: `Cidade inativa: ${cityLocation.name}`,
          });
          return;
        }

        if (!isTerritoryPubliclyNavigable(cityLocation.metadata)) {
          commit({
            status: TERRITORY_RESOLVE_STATUS.RESTRICTED,
            resolved: null,
            error: `${cityLocation.name} não está disponível para navegação pública no momento.`,
          });
          return;
        }

        if (!territorySlug) {
          commit({
            status: TERRITORY_RESOLVE_STATUS.RESOLVED_LOCATION,
            resolved: { kind: "location", location: cityLocation },
            error: null,
          });
          return;
        }

        const scopedPath = `${cityPath}/${territorySlug}`;
        const [locationCandidate, groupCandidate] = await Promise.all([
          withTimeout(locationRepo.findByPath(scopedPath)),
          withTimeout(
            territorialGroupService.getGroupBySlugAndCity(
              territorySlug,
              cityLocation.id,
            ),
          ),
        ]);

        if (locationCandidate && groupCandidate) {
          commit({
            status: TERRITORY_RESOLVE_STATUS.ERROR,
            resolved: null,
            error:
              `Slug territorial ambíguo em ${city}: "${territorySlug}". ` +
              "Locations e grupos territoriais devem compartilhar um namespace único.",
          });
          return;
        }

        if (locationCandidate) {
          if (locationCandidate.parent_id !== cityLocation.id) {
            commit({
              status: TERRITORY_RESOLVE_STATUS.NOT_FOUND,
              resolved: null,
              error: `Território ${territorySlug} não pertence a ${city}`,
            });
            return;
          }

          if (locationCandidate.status !== "active") {
            commit({
              status: TERRITORY_RESOLVE_STATUS.INACTIVE,
              resolved: null,
              error: `Território inativo: ${locationCandidate.name}`,
            });
            return;
          }

          if (!isTerritoryPubliclyNavigable(locationCandidate.metadata)) {
            commit({
              status: TERRITORY_RESOLVE_STATUS.RESTRICTED,
              resolved: null,
              error: `${locationCandidate.name} não está disponível para navegação pública no momento.`,
            });
            return;
          }

          commit({
            status: TERRITORY_RESOLVE_STATUS.RESOLVED_LOCATION,
            resolved: { kind: "location", location: locationCandidate },
            error: null,
          });
          return;
        }

        if (groupCandidate) {
          if (groupCandidate.status !== "active") {
            commit({
              status: TERRITORY_RESOLVE_STATUS.INACTIVE,
              resolved: null,
              error: `Território inativo: ${groupCandidate.name}`,
            });
            return;
          }

          if (!isTerritoryPubliclyNavigable(groupCandidate.metadata)) {
            commit({
              status: TERRITORY_RESOLVE_STATUS.RESTRICTED,
              resolved: null,
              error: `${groupCandidate.name} não está disponível para navegação pública no momento.`,
            });
            return;
          }

          const withMembers = await withTimeout(
            territorialGroupService.getGroupWithMembers(groupCandidate.id),
          );

          if (!withMembers || withMembers.members.length === 0) {
            commit({
              status: TERRITORY_RESOLVE_STATUS.NOT_FOUND,
              resolved: null,
              error: `Grupo territorial sem membros ativos: ${territorySlug}`,
            });
            return;
          }

          commit({
            status: TERRITORY_RESOLVE_STATUS.RESOLVED_GROUP,
            resolved: { kind: "group", group: withMembers },
            error: null,
          });
          return;
        }

        commit({
          status: TERRITORY_RESOLVE_STATUS.NOT_FOUND,
          resolved: null,
          error: `Território não encontrado: ${scopedPath}`,
        });
      } catch (error) {
        const fallbackResult = createResolvedFallbackResult(fallback);
        if (fallbackResult) {
          commit(fallbackResult);
          return;
        }

        commit({
          status: TERRITORY_RESOLVE_STATUS.ERROR,
          resolved: null,
          error:
            error instanceof Error
              ? error.message
              : "Erro desconhecido ao resolver território",
        });
      }
    }

    void resolveTerritory();

    return () => {
      cancelled = true;
    };
  }, [city, country, pathname, state, territorySlug]);

  return result;
}
