/**
 * useResolveTerritoryFromUrl
 *
 * Resolve o território ativo a partir dos params da URL.
 *
 * Padrões canônicos:
 *   /:state/:city                         -> Location city
 *   /:state/:city/:district               -> Location district
 *   /:state/:city/:groupSlug              -> TerritorialGroup
 *   /[modulo]/:state/:city/:district?     -> Location city/district
 *   /[modulo]/:state/:city/:groupSlug     -> TerritorialGroup
 *   /comunidade/:state/:city                -> Location city da comunidade
 *
 * Em /comunidade, o slug pode resolver para grupo territorial quando houver
 * configuração pública da comunidade ou quando o bairro pertencer de forma
 * unívoca a um grupo ativo/navegável.
 */

import { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { createLocationRepository } from '@/core/location/repositories/createLocationRepository';
import { createTerritorialGroupRepository } from '@/core/location/repositories/createTerritorialGroupRepository';
import { TerritoryCommunityRouteService } from '@/core/routing/services/TerritoryCommunityRouteService';
import { resolveCommunityPublicAliasTerritory } from '@/core/routing/services/CommunityPublicAliasTerritoryResolver';
import { APP_MODULE_SLUGS, isAppModulePath } from '@/config/moduleSlugs';
import { TERRITORY_CONFIG } from '@/config/territory';
import type { Location, TerritorialGroupWithMembers } from '@/core/location/types';
import { isTerritoryPubliclyNavigable } from '../utils/territoryVisibility';
import { parsePublicTerritoryPath } from '../utils/publicTerritoryPath';
import { resolvePublicTerritoryFallback } from '../utils/publicTerritoryFallbacks';
import { isCommunityRouteSuffixSegment } from '../utils/territoryUrls';

export const TERRITORY_RESOLVE_STATUS = {
  IDLE: 'idle',
  LOADING: 'loading',
  RESOLVED_LOCATION: 'resolved_location',
  RESOLVED_GROUP: 'resolved_group',
  NOT_FOUND: 'not_found',
  INACTIVE: 'inactive',
  RESTRICTED: 'restricted',
  ERROR: 'error',
} as const;

export type TerritoryResolveStatus =
  (typeof TERRITORY_RESOLVE_STATUS)[keyof typeof TERRITORY_RESOLVE_STATUS];

export type ResolvedTerritory =
  | { kind: 'location'; location: Location }
  | { kind: 'group'; group: TerritorialGroupWithMembers }
  | null;

export interface TerritoryResolveResult {
  status: TerritoryResolveStatus;
  resolved: ResolvedTerritory;
  error: string | null;
}

const RESOLVE_TIMEOUT_MS = 6000;

function createResolvedFallbackResult(fallback: ResolvedTerritory): TerritoryResolveResult | null {
  if (!fallback) return null;

  return {
    status:
      fallback.kind === 'group'
        ? TERRITORY_RESOLVE_STATUS.RESOLVED_GROUP
        : TERRITORY_RESOLVE_STATUS.RESOLVED_LOCATION,
    resolved: fallback,
    error: null,
  };
}

function withTimeout<T>(promise: Promise<T>, timeoutMs = RESOLVE_TIMEOUT_MS): Promise<T> {
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

function normalizePathForCompare(value: string): string {
  return value.trim().replace(/\/+$/g, "").toLowerCase();
}

export function useResolveTerritoryFromUrl(): TerritoryResolveResult {
  const location = useLocation();
  const params = useParams<{
    country?: string;
    state?: string;
    city?: string;
    territorySlug?: string;
    groupSlug?: string;
    groupSlugOrDistrict?: string;
    district?: string;
  }>();

  const pathname = location.pathname;
  const parsedPath = parsePublicTerritoryPath(pathname);
  const country = params.country ?? TERRITORY_CONFIG.defaultCountry;
  const state = params.state ?? parsedPath.state;
  const city = params.city ?? parsedPath.city;
  const groupSlug = params.groupSlug;
  const districtSlug =
    params.territorySlug ||
    params.district ||
    params.groupSlugOrDistrict ||
    parsedPath.territorySlug;

  const isGuideRoute = isAppModulePath(pathname, APP_MODULE_SLUGS.touristPoints);
  const isCommunityRoute = isAppModulePath(pathname, APP_MODULE_SLUGS.community);

  const [result, setResult] = useState<TerritoryResolveResult>({
    status: TERRITORY_RESOLVE_STATUS.IDLE,
    resolved: null,
    error: null,
  });

  useEffect(() => {
    const fallback = resolvePublicTerritoryFallback({
      state,
      city,
      territorySlug: groupSlug || districtSlug,
    });

    if (!country || !state || !city) {
      const fallbackResult = createResolvedFallbackResult(fallback);
      if (fallbackResult) {
        setResult(fallbackResult);
      } else {
        setResult({
          status: TERRITORY_RESOLVE_STATUS.NOT_FOUND,
          resolved: null,
          error: `Território inválido na URL: ${pathname}`,
        });
      }
      return;
    }

    let cancelled = false;
    setResult({ status: TERRITORY_RESOLVE_STATUS.LOADING, resolved: null, error: null });

    async function resolve() {
      try {
        const communitySlug = groupSlug || districtSlug;
        if (
          isCommunityRoute &&
          communitySlug &&
          !isCommunityRouteSuffixSegment(communitySlug)
        ) {
          const expectedCanonicalPath = normalizePathForCompare(
            `/${APP_MODULE_SLUGS.community}/${state}/${city}/${communitySlug}`,
          );
          try {
            const aliasResolution = await withTimeout(
              resolveCommunityPublicAliasTerritory(communitySlug),
            );

            if (
              aliasResolution.status === "resolved" &&
              normalizePathForCompare(aliasResolution.canonicalPath) === expectedCanonicalPath
            ) {
              if (!cancelled) {
                setResult({
                  status:
                    aliasResolution.resolved.kind === "group"
                      ? TERRITORY_RESOLVE_STATUS.RESOLVED_GROUP
                      : TERRITORY_RESOLVE_STATUS.RESOLVED_LOCATION,
                  resolved: aliasResolution.resolved,
                  error: null,
                });
              }
              return;
            }
          } catch {
            // Fall through to the generic territorial resolver.
          }
        }

        const locationRepo = createLocationRepository();
        const cityPath = `/${country}/${state}/${city}`;
        const cityLocation = await withTimeout(locationRepo.findByPath(cityPath));

        if (!cityLocation) {
          if (!cancelled) setResult({ status: TERRITORY_RESOLVE_STATUS.NOT_FOUND, resolved: null, error: `Cidade não encontrada: ${cityPath}` });
          return;
        }

        if (!groupSlug && !districtSlug) {
          if (cityLocation.status !== 'active') {
            if (!cancelled) setResult({ status: TERRITORY_RESOLVE_STATUS.INACTIVE, resolved: null, error: `Cidade inativa: ${cityLocation.name}` });
            return;
          }
          if (!isTerritoryPubliclyNavigable(cityLocation.metadata)) {
            if (!cancelled) {
              setResult({
                status: TERRITORY_RESOLVE_STATUS.RESTRICTED,
                resolved: null,
                error: `${cityLocation.name} não está disponível para navegação pública no momento.`,
              });
            }
            return;
          }
          if (!cancelled) setResult({ status: TERRITORY_RESOLVE_STATUS.RESOLVED_LOCATION, resolved: { kind: 'location', location: cityLocation }, error: null });
          return;
        }

        if (groupSlug) {
          const groupRepo = createTerritorialGroupRepository();
          const group = await withTimeout(groupRepo.findBySlugAndCity(groupSlug, cityLocation.id));

          if (!group) {
            if (!cancelled) setResult({ status: TERRITORY_RESOLVE_STATUS.NOT_FOUND, resolved: null, error: `Grupo não encontrado: ${groupSlug}` });
            return;
          }
          if (group.status !== 'active') {
            if (!cancelled) setResult({ status: TERRITORY_RESOLVE_STATUS.INACTIVE, resolved: null, error: `Grupo inativo: ${group.name}` });
            return;
          }
          if (!isTerritoryPubliclyNavigable(group.metadata)) {
            if (!cancelled) setResult({
              status: TERRITORY_RESOLVE_STATUS.RESTRICTED,
              resolved: null,
              error: `${group.name} não está disponível para navegação pública no momento.`,
            });
            return;
          }

          const withMembers = await withTimeout(groupRepo.findWithMembers(group.id));
          if (!withMembers) {
            if (!cancelled) setResult({ status: TERRITORY_RESOLVE_STATUS.NOT_FOUND, resolved: null, error: `Grupo sem membros: ${groupSlug}` });
            return;
          }
          if (!cancelled) setResult({ status: TERRITORY_RESOLVE_STATUS.RESOLVED_GROUP, resolved: { kind: 'group', group: withMembers }, error: null });
          return;
        }

        if (!isTerritoryPubliclyNavigable(cityLocation.metadata)) {
          if (!cancelled) {
            setResult({
              status: TERRITORY_RESOLVE_STATUS.RESTRICTED,
              resolved: null,
              error: `${cityLocation.name} não está disponível para navegação pública no momento.`,
            });
          }
          return;
        }

        if (districtSlug) {
          const communityRoute = await withTimeout(
            TerritoryCommunityRouteService.resolveByCityAndSlug(cityLocation.id, districtSlug),
          );
          if (communityRoute) {
            if (communityRoute.territory_type === 'territorial_group') {
              const groupRepo = createTerritorialGroupRepository();
              const withMembers = await withTimeout(groupRepo.findWithMembers(communityRoute.territory_id));
              if (withMembers && withMembers.status === 'active' && isTerritoryPubliclyNavigable(withMembers.metadata)) {
                if (!cancelled) {
                  setResult({
                    status: TERRITORY_RESOLVE_STATUS.RESOLVED_GROUP,
                    resolved: { kind: 'group', group: withMembers },
                    error: null,
                  });
                }
                return;
              }
            } else {
              const locationById = await withTimeout(locationRepo.findById(communityRoute.territory_id));
              if (
                locationById &&
                locationById.status === 'active' &&
                locationById.parent_id === cityLocation.id &&
                isTerritoryPubliclyNavigable(locationById.metadata)
              ) {
                if (!cancelled) {
                  setResult({
                    status: TERRITORY_RESOLVE_STATUS.RESOLVED_LOCATION,
                    resolved: { kind: 'location', location: locationById },
                    error: null,
                  });
                }
                return;
              }
            }
          }

          if (isCommunityRoute) {
            const groupRepo = createTerritorialGroupRepository();
            const group = await withTimeout(groupRepo.findBySlugAndCity(districtSlug, cityLocation.id));
            if (group && group.status === 'active' && isTerritoryPubliclyNavigable(group.metadata)) {
              const withMembers = await withTimeout(groupRepo.findWithMembers(group.id));
              if (withMembers) {
                if (!cancelled) {
                  setResult({
                    status: TERRITORY_RESOLVE_STATUS.RESOLVED_GROUP,
                    resolved: { kind: 'group', group: withMembers },
                    error: null,
                  });
                }
                return;
              }
            }
          }
        }

        const districtPath = `${cityPath}/${districtSlug}`;
        const districtLocation = await withTimeout(locationRepo.findByPath(districtPath));

        if (!districtLocation) {
          // Em rotas de módulo, aceita slug de grupo no padrão público limpo.
          if (!isCommunityRoute) {
            const groupRepo = createTerritorialGroupRepository();
            const groupBySlug = await withTimeout(groupRepo.findBySlugAndCity(districtSlug!, cityLocation.id));
            if (groupBySlug && groupBySlug.status === 'active' && isTerritoryPubliclyNavigable(groupBySlug.metadata)) {
              const withMembers = await withTimeout(groupRepo.findWithMembers(groupBySlug.id));
              if (withMembers) {
                if (!cancelled) {
                  setResult({
                    status: TERRITORY_RESOLVE_STATUS.RESOLVED_GROUP,
                    resolved: { kind: 'group', group: withMembers },
                    error: null,
                  });
                }
                return;
              }
            }
          }

          if (isGuideRoute) {
            if (cityLocation.status !== 'active') {
              if (!cancelled) setResult({ status: TERRITORY_RESOLVE_STATUS.INACTIVE, resolved: null, error: `Cidade inativa: ${cityLocation.name}` });
              return;
            }
            if (!cancelled) setResult({ status: TERRITORY_RESOLVE_STATUS.RESOLVED_LOCATION, resolved: { kind: 'location', location: cityLocation }, error: null });
            return;
          }

          if (!cancelled) setResult({ status: TERRITORY_RESOLVE_STATUS.NOT_FOUND, resolved: null, error: `Local não encontrado: ${districtPath}` });
          return;
        }

        if (districtLocation.status !== 'active') {
          if (!cancelled) setResult({ status: TERRITORY_RESOLVE_STATUS.INACTIVE, resolved: null, error: `Bairro inativo: ${districtLocation.name}` });
          return;
        }

        if (districtLocation.parent_id !== cityLocation.id) {
          if (!cancelled) setResult({ status: TERRITORY_RESOLVE_STATUS.NOT_FOUND, resolved: null, error: `Bairro ${districtSlug} não pertence a ${city}` });
          return;
        }

        if (!isTerritoryPubliclyNavigable(districtLocation.metadata)) {
          if (!cancelled) setResult({
            status: TERRITORY_RESOLVE_STATUS.RESTRICTED,
            resolved: null,
            error: `${districtLocation.name} não está disponível para navegação pública no momento.`,
          });
          return;
        }

        if (isCommunityRoute) {
          const groupRepo = createTerritorialGroupRepository();
          const containingGroups = await withTimeout(groupRepo.findGroupsContainingLocation(districtLocation.id));
          const eligibleGroups = containingGroups.filter(
            (group) =>
              group.status === 'active' &&
              group.anchor_city_id === cityLocation.id &&
              isTerritoryPubliclyNavigable(group.metadata),
          );

          // Evita ambiguidade: promove para grupo apenas quando há associação única.
          if (eligibleGroups.length === 1) {
            const withMembers = await withTimeout(groupRepo.findWithMembers(eligibleGroups[0].id));
            if (withMembers && withMembers.status === 'active' && isTerritoryPubliclyNavigable(withMembers.metadata)) {
              if (!cancelled) {
                setResult({
                  status: TERRITORY_RESOLVE_STATUS.RESOLVED_GROUP,
                  resolved: { kind: 'group', group: withMembers },
                  error: null,
                });
              }
              return;
            }
          }
        }

        if (!cancelled) setResult({ status: TERRITORY_RESOLVE_STATUS.RESOLVED_LOCATION, resolved: { kind: 'location', location: districtLocation }, error: null });
      } catch (err) {
        const fallbackResult = createResolvedFallbackResult(fallback);
        if (!cancelled && fallbackResult) {
          setResult(fallbackResult);
          return;
        }

        if (!cancelled) {
          setResult({ status: TERRITORY_RESOLVE_STATUS.ERROR, resolved: null, error: err instanceof Error ? err.message : 'Erro desconhecido' });
        }
      }
    }

    resolve();
    return () => { cancelled = true; };
  }, [city, country, districtSlug, groupSlug, isCommunityRoute, isGuideRoute, pathname, state]);

  return result;
}
