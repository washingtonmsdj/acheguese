import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useActiveTerritory } from "@/core/location/hooks/useActiveTerritory";
import { createLocationRepository } from "@/core/location/repositories/createLocationRepository";
import { LOCATION_PAGINATION, LocationStatus, LocationType } from "@/core/location/types";
import type { Location } from "@/core/location/types";

export interface ServiceAreaOption {
  id: string;
  name: string;
  slug: string;
  type: LocationType;
  geographicPath: string;
}

function toOption(location: Location): ServiceAreaOption {
  return {
    id: location.id,
    name: location.name,
    slug: location.slug,
    type: location.type,
    geographicPath: location.geographic_path,
  };
}

async function fetchAllChildrenByType(
  cityId: string,
  type: LocationType,
): Promise<ServiceAreaOption[]> {
  const repo = createLocationRepository();
  const pageSize = LOCATION_PAGINATION.MAX_PAGE_SIZE;
  let page = 1;
  const options: ServiceAreaOption[] = [];

  while (true) {
    const result = await repo.findChildren(cityId, {
      type,
      status: LocationStatus.ACTIVE,
      page,
      page_size: pageSize,
    });

    options.push(...result.locations.map(toOption));

    if (result.locations.length < pageSize) break;
    page += 1;
  }

  return options.sort((a, b) => a.name.localeCompare(b.name));
}

async function resolveCity(locationId: string | null): Promise<Location | null> {
  if (!locationId) return null;

  const repo = createLocationRepository();
  const location = await repo.findById(locationId);
  if (!location) return null;

  if (location.type === LocationType.CITY) return location;

  if (
    (location.type === LocationType.NEIGHBORHOOD || location.type === LocationType.DISTRICT) &&
    location.parent_id
  ) {
    const parent = await repo.findById(location.parent_id);
    return parent?.type === LocationType.CITY ? parent : null;
  }

  return null;
}

async function fetchServiceAreaOptions(locationId: string | null): Promise<{
  city: Location | null;
  options: ServiceAreaOption[];
}> {
  const city = await resolveCity(locationId);
  if (!city) return { city: null, options: [] };

  const neighborhoods = await fetchAllChildrenByType(city.id, LocationType.NEIGHBORHOOD);
  if (neighborhoods.length > 0) return { city, options: neighborhoods };

  const districts = await fetchAllChildrenByType(city.id, LocationType.DISTRICT);
  return { city, options: districts };
}

export function useServiceAreaOptions(preferredLocationId?: string | null) {
  const { activeLocation } = useActiveTerritory();

  const sourceLocationId = useMemo(
    () => preferredLocationId ?? activeLocation?.id ?? null,
    [activeLocation?.id, preferredLocationId],
  );

  const query = useQuery({
    queryKey: ["professional-service-area-options", sourceLocationId],
    queryFn: () => fetchServiceAreaOptions(sourceLocationId),
    enabled: Boolean(sourceLocationId),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  return {
    options: query.data?.options ?? [],
    city: query.data?.city ?? null,
    isLoading: Boolean(sourceLocationId) && query.isLoading,
    isUnavailable: !sourceLocationId || (!query.isLoading && (query.data?.options.length ?? 0) === 0),
  };
}
