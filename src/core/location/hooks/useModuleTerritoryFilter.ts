import { useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { TERRITORY_CONFIG } from '@/config/territory';
import type { ResolvedTerritory } from '@/core/routing/hooks/useResolveTerritoryFromUrl';
import { createLocationRepository } from '../repositories/createLocationRepository';
import { useResolvedUserLocation } from './useResolvedUserLocation';
import { useUserTerritory } from './useUserTerritory';
import type { Location, TerritoryFilter } from '../types';
import { LocationStatus } from '../types';

export type ModuleTerritorySource = 'url' | 'filter' | 'nearby' | 'fallback';

export interface ModuleTerritoryUiFilter {
  stateSlug?: string | null;
  citySlug?: string | null;
  locationSlug?: string | null;
}

export interface UseModuleTerritoryFilterOptions {
  routeResolved?: ResolvedTerritory | null;
  uiFilter?: ModuleTerritoryUiFilter | null;
  searchParamKeys?: string[];
  nearbyEnabled?: boolean;
  includeDescendants?: boolean;
}

export interface ModuleTerritoryFilterResult {
  resolvedLocationIds: string[];
  territoryFilter: TerritoryFilter;
  source: ModuleTerritorySource;
  displayLabel: string;
  location: Location | null;
  centerCoords: { latitude: number; longitude: number } | null;
  isLoading: boolean;
}

interface RouteParams {
  state?: string;
  city?: string;
  district?: string;
  groupSlug?: string;
  groupSlugOrDistrict?: string;
}

function publicPathToGeoPath(path: string): string {
  const clean = path.replace(/^\/+/, '');
  return clean.startsWith('br/') ? `/${clean}` : `/br/${clean}`;
}

function getRouteLocation(routeResolved?: ResolvedTerritory | null): {
  location: Location | null;
  ids: string[];
  label: string | null;
} {
  if (!routeResolved) return { location: null, ids: [], label: null };

  if (routeResolved.kind === 'location') {
    return {
      location: routeResolved.location,
      ids: [routeResolved.location.id],
      label: routeResolved.location.name,
    };
  }

  const ids = routeResolved.group.members.map((member) => member.id);
  return {
    location: routeResolved.group.members[0] ?? null,
    ids,
    label: routeResolved.group.name,
  };
}

function buildSlugPath(input: {
  stateSlug?: string | null;
  citySlug?: string | null;
  locationSlug?: string | null;
}): string | null {
  const stateSlug = input.stateSlug?.trim();
  const citySlug = input.citySlug?.trim();
  const locationSlug = input.locationSlug?.trim();

  if (!stateSlug || !citySlug) return null;
  return locationSlug
    ? publicPathToGeoPath(`${stateSlug}/${citySlug}/${locationSlug}`)
    : publicPathToGeoPath(`${stateSlug}/${citySlug}`);
}

export function useModuleTerritoryFilter({
  routeResolved,
  uiFilter,
  searchParamKeys = ['location', 'bairro'],
  nearbyEnabled = true,
  includeDescendants = true,
}: UseModuleTerritoryFilterOptions = {}): ModuleTerritoryFilterResult {
  const routeParams = useParams<RouteParams>();
  const [searchParams] = useSearchParams();
  const userTerritory = useUserTerritory();
  const nearbyLocation = useResolvedUserLocation({
    autoResolve: nearbyEnabled,
    tryGps: nearbyEnabled,
  });

  const routeLocation = useMemo(() => getRouteLocation(routeResolved), [routeResolved]);

  const queryLocationSlug = searchParamKeys
    .map((key) => searchParams.get(key))
    .find((value): value is string => Boolean(value?.trim()));

  const filterPath = buildSlugPath({
    stateSlug: uiFilter?.stateSlug ?? routeParams.state,
    citySlug: uiFilter?.citySlug ?? routeParams.city,
    locationSlug:
      uiFilter?.locationSlug ??
      routeParams.district ??
      routeParams.groupSlugOrDistrict ??
      queryLocationSlug,
  });

  const { data: filterLocation, isLoading: isFilterLoading } = useQuery({
    queryKey: ['module-territory-filter', 'filter', filterPath],
    queryFn: async () => {
      if (!filterPath) return null;
      return createLocationRepository().findByPath(filterPath);
    },
    enabled: Boolean(filterPath),
    staleTime: 10 * 60 * 1000,
  });

  const fallbackPath = publicPathToGeoPath(
    `${TERRITORY_CONFIG.launch.state}/${TERRITORY_CONFIG.launch.city}`,
  );

  const { data: fallbackLocation, isLoading: isFallbackLoading } = useQuery({
    queryKey: ['module-territory-filter', 'fallback', fallbackPath],
    queryFn: () => createLocationRepository().findByPath(fallbackPath),
    staleTime: 30 * 60 * 1000,
  });

  const selected = useMemo(() => {
    if (routeLocation.ids.length > 0) {
      return {
        source: 'url' as const,
        location: routeLocation.location,
        ids: routeLocation.ids,
        label: routeLocation.label ?? 'Localidade',
        centerCoords: null,
      };
    }

    if (filterLocation?.status === LocationStatus.ACTIVE) {
      return {
        source: 'filter' as const,
        location: filterLocation,
        ids: [filterLocation.id],
        label: filterLocation.name,
        centerCoords: null,
      };
    }

    if (nearbyEnabled && nearbyLocation.coords) {
      const gpsLocationId = nearbyLocation.location?.locationId;
      if (gpsLocationId) {
        return {
          source: 'nearby' as const,
          location: null,
          ids: [gpsLocationId],
          label: 'Perto de voce',
          centerCoords: nearbyLocation.coords,
        };
      }
    }

    if (nearbyEnabled && userTerritory.homeDistrict) {
      return {
        source: 'nearby' as const,
        location: null,
        ids: [userTerritory.homeDistrict.id],
        label: userTerritory.homeDistrict.name,
        centerCoords: null,
      };
    }

    if (nearbyEnabled && userTerritory.homeCity) {
      return {
        source: 'nearby' as const,
        location: null,
        ids: [userTerritory.homeCity.id],
        label: userTerritory.homeCity.name,
        centerCoords: null,
      };
    }

    if (fallbackLocation) {
      return {
        source: 'fallback' as const,
        location: fallbackLocation,
        ids: [fallbackLocation.id],
        label: fallbackLocation.name,
        centerCoords: null,
      };
    }

    return {
      source: 'fallback' as const,
      location: null,
      ids: [] as string[],
      label: TERRITORY_CONFIG.launch.name,
      centerCoords: null,
    };
  }, [
    fallbackLocation,
    filterLocation,
    nearbyEnabled,
    nearbyLocation.location?.locationId,
    nearbyLocation.coords,
    routeLocation,
    userTerritory.homeCity,
    userTerritory.homeDistrict,
  ]);

  const { data: descendantIds = selected.ids, isLoading: isDescendantsLoading } = useQuery({
    queryKey: ['module-territory-filter', 'descendants', selected.ids, includeDescendants],
    queryFn: async () => {
      if (!includeDescendants || selected.ids.length !== 1) return selected.ids;
      const repo = createLocationRepository();
      const result = await repo.findDescendants(selected.ids[0], {
        include_self: true,
        page_size: 500,
      });
      return result.locations.length > 0
        ? result.locations.map((location) => location.id)
        : selected.ids;
    },
    enabled: selected.ids.length === 1,
    staleTime: 10 * 60 * 1000,
  });

  const resolvedLocationIds = selected.ids.length === 1 ? descendantIds : selected.ids;
  const territoryFilter: TerritoryFilter =
    resolvedLocationIds.length === 0
      ? { scope: 'none' }
      : resolvedLocationIds.length === 1
        ? { scope: 'location', location_id: resolvedLocationIds[0] }
        : { scope: 'group', location_ids: resolvedLocationIds };

  return {
    resolvedLocationIds,
    territoryFilter,
    source: selected.source,
    displayLabel: selected.label,
    location: selected.location,
    centerCoords: selected.centerCoords,
    isLoading:
      isFilterLoading ||
      isFallbackLoading ||
      isDescendantsLoading ||
      userTerritory.loading ||
      (nearbyEnabled && nearbyLocation.isLoading),
  };
}
