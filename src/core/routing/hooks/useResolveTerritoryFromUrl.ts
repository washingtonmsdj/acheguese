/**
 * useResolveTerritoryFromUrl
 *
 * Resolve o territ?rio ativo a partir dos params da URL.
 *
 * Padr?es can?nicos:
 *   /:state/:city                         -> Location city
 *   /:state/:city/:district               -> Location district
 *   /:state/:city/:groupSlug              -> TerritorialGroup
 *   /[modulo]/:state/:city/:district?     -> Location city/district
 *   /[modulo]/:state/:city/:groupSlug     -> TerritorialGroup
 *   /comunidade/:state/:city/:territorySlug -> Resolver por slug p?blico de comunidade
 *
 * Em /comunidade, o slug pode resolver para grupo territorial quando houver
 * configura??o p?blica da comunidade ou quando o bairro pertencer de forma
 * un?voca a um grupo ativo/naveg?vel.
 */

import { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { createLocationRepository } from '@/core/location/repositories/createLocationRepository';
import { createTerritorialGroupRepository } from '@/core/location/repositories/createTerritorialGroupRepository';
import { TerritoryCommunityRouteService } from '@/core/routing/services/TerritoryCommunityRouteService';
import { APP_MODULE_SLUGS, isAppModulePath } from '@/config/moduleSlugs';
import { TERRITORY_CONFIG } from '@/config/territory';
import type { Location, TerritorialGroupWithMembers } from '@/core/location/types';
import { isTerritoryPubliclyNavigable } from '../utils/territoryVisibility';

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
  const country = params.country ?? TERRITORY_CONFIG.defaultCountry;
  const state = params.state;
  const city = params.city;
  const groupSlug = params.groupSlug;
  let districtSlug = params.territorySlug || params.district || params.groupSlugOrDistrict;
  if (districtSlug === '_') districtSlug = undefined;

  const isGuideRoute =
    isAppModulePath(pathname, APP_MODULE_SLUGS.touristPoints) ||
    pathname.startsWith(`/guia/${APP_MODULE_SLUGS.touristPoints}/`);
  const isCommunityRoute = isAppModulePath(pathname, APP_MODULE_SLUGS.community);

  const [result, setResult] = useState<TerritoryResolveResult>({
    status: TERRITORY_RESOLVE_STATUS.IDLE,
    resolved: null,
    error: null,
  });

  useEffect(() => {
    if (!country || !state || !city) return;

    let cancelled = false;
    setResult({ status: TERRITORY_RESOLVE_STATUS.LOADING, resolved: null, error: null });

    async function resolve() {
      try {
        const locationRepo = createLocationRepository();
        const cityPath = `/${country}/${state}/${city}`;
        const cityLocation = await locationRepo.findByPath(cityPath);

        if (!cityLocation) {
          if (!cancelled) setResult({ status: TERRITORY_RESOLVE_STATUS.NOT_FOUND, resolved: null, error: `Cidade n?o encontrada: ${cityPath}` });
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
                error: `${cityLocation.name} n?o est? dispon?vel para navega??o p?blica no momento.`,
              });
            }
            return;
          }
          if (!cancelled) setResult({ status: TERRITORY_RESOLVE_STATUS.RESOLVED_LOCATION, resolved: { kind: 'location', location: cityLocation }, error: null });
          return;
        }

        if (groupSlug) {
          const groupRepo = createTerritorialGroupRepository();
          const group = await groupRepo.findBySlugAndCity(groupSlug, cityLocation.id);

          if (!group) {
            if (!cancelled) setResult({ status: TERRITORY_RESOLVE_STATUS.NOT_FOUND, resolved: null, error: `Grupo n?o encontrado: ${groupSlug}` });
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
              error: `${group.name} n?o est? dispon?vel para navega??o p?blica no momento.`,
            });
            return;
          }

          const withMembers = await groupRepo.findWithMembers(group.id);
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
              error: `${cityLocation.name} n?o est? dispon?vel para navega??o p?blica no momento.`,
            });
          }
          return;
        }

        if (districtSlug) {
          const communityRoute = await TerritoryCommunityRouteService.resolveByCityAndSlug(cityLocation.id, districtSlug);
          if (communityRoute) {
            if (communityRoute.territory_type === 'territorial_group') {
              const groupRepo = createTerritorialGroupRepository();
              const withMembers = await groupRepo.findWithMembers(communityRoute.territory_id);
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
              const locationById = await locationRepo.findById(communityRoute.territory_id);
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
            const group = await groupRepo.findBySlugAndCity(districtSlug, cityLocation.id);
            if (group && group.status === 'active' && isTerritoryPubliclyNavigable(group.metadata)) {
              const withMembers = await groupRepo.findWithMembers(group.id);
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
        const districtLocation = await locationRepo.findByPath(districtPath);

        if (!districtLocation) {
          // Em rotas de m?dulo, aceita slug de grupo no padr?o p?blico limpo.
          if (!isCommunityRoute) {
            const groupRepo = createTerritorialGroupRepository();
            const groupBySlug = await groupRepo.findBySlugAndCity(districtSlug!, cityLocation.id);
            if (groupBySlug && groupBySlug.status === 'active' && isTerritoryPubliclyNavigable(groupBySlug.metadata)) {
              const withMembers = await groupRepo.findWithMembers(groupBySlug.id);
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

          if (!cancelled) setResult({ status: TERRITORY_RESOLVE_STATUS.NOT_FOUND, resolved: null, error: `Local n?o encontrado: ${districtPath}` });
          return;
        }

        if (districtLocation.status !== 'active') {
          if (!cancelled) setResult({ status: TERRITORY_RESOLVE_STATUS.INACTIVE, resolved: null, error: `Bairro inativo: ${districtLocation.name}` });
          return;
        }

        if (districtLocation.parent_id !== cityLocation.id) {
          if (!cancelled) setResult({ status: TERRITORY_RESOLVE_STATUS.NOT_FOUND, resolved: null, error: `Bairro ${districtSlug} n?o pertence a ${city}` });
          return;
        }

        if (!isTerritoryPubliclyNavigable(districtLocation.metadata)) {
          if (!cancelled) setResult({
            status: TERRITORY_RESOLVE_STATUS.RESTRICTED,
            resolved: null,
            error: `${districtLocation.name} n?o est? dispon?vel para navega??o p?blica no momento.`,
          });
          return;
        }

        if (isCommunityRoute) {
          const groupRepo = createTerritorialGroupRepository();
          const containingGroups = await groupRepo.findGroupsContainingLocation(districtLocation.id);
          const eligibleGroups = containingGroups.filter(
            (group) =>
              group.status === 'active' &&
              group.anchor_city_id === cityLocation.id &&
              isTerritoryPubliclyNavigable(group.metadata),
          );

          // Evita ambiguidade: promove para grupo apenas quando h? associa??o ?nica.
          if (eligibleGroups.length === 1) {
            const withMembers = await groupRepo.findWithMembers(eligibleGroups[0].id);
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
        if (!cancelled) {
          setResult({ status: TERRITORY_RESOLVE_STATUS.ERROR, resolved: null, error: err instanceof Error ? err.message : 'Erro desconhecido' });
        }
      }
    }

    resolve();
    return () => { cancelled = true; };
  }, [country, state, city, groupSlug, districtSlug, isCommunityRoute, isGuideRoute]);

  return result;
}
