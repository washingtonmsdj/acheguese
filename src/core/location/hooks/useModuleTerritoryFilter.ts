import { useMemo } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { TERRITORY_CONFIG } from "@/config/territory";
import type { ResolvedTerritory } from "@/core/routing/hooks/useResolveTerritoryFromUrl";
import { isPublicTerritoryFallbackLocation } from "@/core/routing/utils/publicTerritoryFallbacks";
import { isValidUUID } from "@/shared/utils/validation";
import { createLocationRepository } from "../repositories/createLocationRepository";
import { useResolvedUserLocation } from "./useResolvedUserLocation";
import { useUserTerritory } from "./useUserTerritory";
import type { Location, TerritoryFilter } from "../types";
import { LocationStatus } from "../types";

export type ModuleTerritorySource = "url" | "filter" | "nearby" | "fallback";

export interface ModuleTerritoryUiFilter {
  stateSlug?: string | null;
  citySlug?: string | null;
  locationSlug?: string | null;
}

export interface UseModuleTerritoryFilterOptions {
  routeResolved?: ResolvedTerritory | null;
  activeMemberIds?: string[];
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

interface SelectedTerritoryCandidate {
  source: ModuleTerritorySource;
  location: Location | null;
  ids: string[];
  label: string;
  centerCoords: { latitude: number; longitude: number } | null;
  path: string | null;
}

interface RouteParams {
  state?: string;
  city?: string;
  district?: string;
  groupSlug?: string;
  groupSlugOrDistrict?: string;
}

function publicPathToGeoPath(path: string): string {
  const clean = path.replace(/^\/+/, "");
  return clean.startsWith("br/") ? `/${clean}` : `/br/${clean}`;
}

function getRouteLocation(
  routeResolved?: ResolvedTerritory | null,
  activeMemberIds?: string[],
): {
  location: Location | null;
  ids: string[];
  label: string | null;
} {
  if (!routeResolved) return { location: null, ids: [], label: null };

  if (routeResolved.kind === "location") {
    return {
      location: routeResolved.location,
      ids: [routeResolved.location.id],
      label: routeResolved.location.name,
    };
  }

  const ids =
    activeMemberIds !== undefined
      ? activeMemberIds
      : routeResolved.group.members.map((member) => member.id);
  return {
    location: routeResolved.group.members.at(0) ?? null,
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
  activeMemberIds,
  uiFilter,
  searchParamKeys = ["location", "bairro"],
  nearbyEnabled = true,
  includeDescendants = true,
}: UseModuleTerritoryFilterOptions = {}): ModuleTerritoryFilterResult {
  const routeParams = useParams() as Readonly<RouteParams>;
  const [searchParams] = useSearchParams();
  const userTerritory = useUserTerritory({ enabled: nearbyEnabled });
  const nearbyLocation = useResolvedUserLocation({
    autoResolve: nearbyEnabled,
    tryGps: nearbyEnabled,
  });

  const routeLocation = useMemo(
    () => getRouteLocation(routeResolved, activeMemberIds),
    [activeMemberIds, routeResolved],
  );
  const isFallbackRouteResolved = useMemo(() => {
    if (!routeResolved) return false;

    if (routeResolved.kind === "location") {
      return isPublicTerritoryFallbackLocation(routeResolved.location);
    }

    return routeResolved.group.members.some((member) =>
      isPublicTerritoryFallbackLocation(member),
    );
  }, [routeResolved]);

  const queryLocationSlug = searchParamKeys
    .map((key) => searchParams.get(key))
    .find((value): value is string => Boolean(value?.trim()));

  const filterPath = buildSlugPath({
    stateSlug: uiFilter?.stateSlug ?? routeParams.state,
    citySlug: uiFilter?.citySlug ?? routeParams.city,
    locationSlug:
      uiFilter?.locationSlug ??
      routeParams.district ??
      routeParams.groupSlug ??
      routeParams.groupSlugOrDistrict ??
      queryLocationSlug,
  });

  const canonicalFallbackPath = useMemo(() => {
    if (!isFallbackRouteResolved) return null;
    return routeLocation.location?.geographic_path ?? null;
  }, [isFallbackRouteResolved, routeLocation.location]);

  const effectiveFilterPath = canonicalFallbackPath ?? filterPath;
  const hasResolvedRouteLocation =
    routeLocation.ids.length > 0 && !isFallbackRouteResolved;

  const { data: filterLocation, isLoading: isFilterLoading } = useQuery({
    queryKey: ["module-territory-filter", "filter", effectiveFilterPath],
    queryFn: async () => {
      if (!effectiveFilterPath) return null;
      return createLocationRepository().findByPath(effectiveFilterPath);
    },
    enabled: Boolean(effectiveFilterPath) && !hasResolvedRouteLocation,
    staleTime: 10 * 60 * 1000,
  });

  const fallbackPath = publicPathToGeoPath(
    `${TERRITORY_CONFIG.launch.state}/${TERRITORY_CONFIG.launch.city}`,
  );

  const { data: fallbackLocation, isLoading: isFallbackLoading } = useQuery({
    queryKey: ["module-territory-filter", "fallback", fallbackPath],
    queryFn: () => createLocationRepository().findByPath(fallbackPath),
    enabled: !hasResolvedRouteLocation,
    staleTime: 30 * 60 * 1000,
  });

  const canonicalRouteLocation = useMemo(() => {
    if (
      !isFallbackRouteResolved ||
      filterLocation?.status !== LocationStatus.ACTIVE ||
      !routeLocation.ids.length
    ) {
      return routeLocation;
    }

    return {
      location: filterLocation,
      ids: [filterLocation.id],
      label: filterLocation.name,
    };
  }, [filterLocation, isFallbackRouteResolved, routeLocation]);

  const selected = useMemo<SelectedTerritoryCandidate>(() => {
    if (canonicalRouteLocation.ids.length > 0) {
      return {
        source: "url" as const,
        location: canonicalRouteLocation.location,
        ids: canonicalRouteLocation.ids,
        label: canonicalRouteLocation.label ?? "Localidade",
        centerCoords: null,
        path:
          canonicalRouteLocation.location?.geographic_path ??
          effectiveFilterPath,
      };
    }

    if (filterLocation?.status === LocationStatus.ACTIVE) {
      return {
        source: "filter" as const,
        location: filterLocation,
        ids: [filterLocation.id],
        label: filterLocation.name,
        centerCoords: null,
        path: filterLocation.geographic_path,
      };
    }

    if (nearbyEnabled && nearbyLocation.coords) {
      const gpsLocationId = nearbyLocation.location?.locationId;
      if (gpsLocationId) {
        return {
          source: "nearby" as const,
          location: null,
          ids: [gpsLocationId],
          label: "Perto de voce",
          centerCoords: nearbyLocation.coords,
          path: null,
        };
      }
    }

    if (nearbyEnabled && userTerritory.homeDistrict) {
      return {
        source: "nearby" as const,
        location: null,
        ids: [userTerritory.homeDistrict.id],
        label: userTerritory.homeDistrict.name,
        centerCoords: null,
        path: userTerritory.homeDistrict.path,
      };
    }

    if (nearbyEnabled && userTerritory.homeCity) {
      return {
        source: "nearby" as const,
        location: null,
        ids: [userTerritory.homeCity.id],
        label: userTerritory.homeCity.name,
        centerCoords: null,
        path: userTerritory.homeCity.path,
      };
    }

    if (fallbackLocation) {
      return {
        source: "fallback" as const,
        location: fallbackLocation,
        ids: [fallbackLocation.id],
        label: fallbackLocation.name,
        centerCoords: null,
        path: fallbackLocation.geographic_path,
      };
    }

    return {
      source: "fallback" as const,
      location: null,
      ids: [] as string[],
      label: TERRITORY_CONFIG.launch.name,
      centerCoords: null,
      path: null,
    };
  }, [
    canonicalRouteLocation,
    effectiveFilterPath,
    fallbackLocation,
    filterLocation,
    nearbyEnabled,
    nearbyLocation.location?.locationId,
    nearbyLocation.coords,
    userTerritory.homeCity,
    userTerritory.homeDistrict,
  ]);

  const canonicalSelectedPath = useMemo(() => {
    if (
      selected.location &&
      !isPublicTerritoryFallbackLocation(selected.location)
    ) {
      return null;
    }

    if (selected.path) {
      return publicPathToGeoPath(selected.path);
    }

    return selected.location?.geographic_path ?? null;
  }, [selected.location, selected.path]);

  const {
    data: canonicalSelectedLocation,
    isLoading: isCanonicalSelectedLoading,
  } = useQuery({
    queryKey: [
      "module-territory-filter",
      "selected-fallback",
      canonicalSelectedPath,
    ],
    queryFn: async () => {
      if (!canonicalSelectedPath) return null;
      return createLocationRepository().findByPath(canonicalSelectedPath);
    },
    enabled: Boolean(canonicalSelectedPath),
    staleTime: 10 * 60 * 1000,
  });

  const isAwaitingCanonicalSelected =
    Boolean(canonicalSelectedPath) && isCanonicalSelectedLoading;

  const normalizedSelected = useMemo(() => {
    if (
      !canonicalSelectedLocation ||
      canonicalSelectedLocation.status !== LocationStatus.ACTIVE ||
      (selected.location !== null &&
        !isPublicTerritoryFallbackLocation(selected.location))
    ) {
      return selected;
    }

    return {
      ...selected,
      location: canonicalSelectedLocation,
      ids: [canonicalSelectedLocation.id],
      label: canonicalSelectedLocation.name,
    };
  }, [canonicalSelectedLocation, selected]);

  const hasCanonicalLocationId =
    normalizedSelected.ids.length === 1 &&
    isValidUUID(normalizedSelected.ids[0]);

  const {
    data: descendantIds = normalizedSelected.ids,
    isLoading: isDescendantsLoading,
  } = useQuery({
    queryKey: [
      "module-territory-filter",
      "descendants",
      normalizedSelected.ids,
      includeDescendants,
    ],
    queryFn: async () => {
      if (!includeDescendants || normalizedSelected.ids.length !== 1)
        return normalizedSelected.ids;
      const repo = createLocationRepository();
      const result = await repo.findDescendants(normalizedSelected.ids[0], {
        include_self: true,
        page_size: 500,
      });
      return result.locations.length > 0
        ? result.locations.map((location) => location.id)
        : normalizedSelected.ids;
    },
    enabled:
      hasCanonicalLocationId &&
      !isAwaitingCanonicalSelected &&
      !isPublicTerritoryFallbackLocation(normalizedSelected.location),
    staleTime: 10 * 60 * 1000,
  });

  const resolvedLocationIds =
    hasCanonicalLocationId &&
    !isAwaitingCanonicalSelected &&
    !isPublicTerritoryFallbackLocation(normalizedSelected.location)
      ? descendantIds
      : normalizedSelected.ids;
  const safeResolvedLocationIds = resolvedLocationIds.filter((id) =>
    isValidUUID(id),
  );
  const territoryFilter: TerritoryFilter =
    safeResolvedLocationIds.length === 0
      ? { scope: "none" }
      : safeResolvedLocationIds.length === 1
        ? { scope: "location", location_id: safeResolvedLocationIds[0] }
        : { scope: "group", location_ids: safeResolvedLocationIds };

  return {
    resolvedLocationIds: safeResolvedLocationIds,
    territoryFilter,
    source: normalizedSelected.source,
    displayLabel: normalizedSelected.label,
    location: normalizedSelected.location,
    centerCoords: normalizedSelected.centerCoords,
    isLoading:
      isFilterLoading ||
      isFallbackLoading ||
      isCanonicalSelectedLoading ||
      isAwaitingCanonicalSelected ||
      (!isPublicTerritoryFallbackLocation(normalizedSelected.location) &&
        isDescendantsLoading) ||
      (nearbyEnabled && userTerritory.loading) ||
      (nearbyEnabled && nearbyLocation.isLoading),
  };
}
