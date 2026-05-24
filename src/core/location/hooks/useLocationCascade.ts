/**
 * useLocationCascade
 *
 * Loads states -> cities -> localities from the canonical `locations` table.
 *
 * SSOT:
 * - official municipal neighborhoods use type=neighborhood;
 * - IBGE districts use type=district and are only used as national coverage
 *   when the city does not have municipal neighborhoods registered yet.
 */

import { useEffect, useState } from "react";
import { createLocationRepository } from "../repositories/createLocationRepository";
import { LOCATION_PAGINATION, LocationStatus, LocationType } from "../types";

export interface LocationOption {
  id: string;
  name: string;
  slug: string;
  geographic_path: string;
  type: LocationType;
}

interface UseLocationCascadeReturn {
  states: LocationOption[];
  cities: LocationOption[];
  neighborhoods: LocationOption[];
  loadingStates: boolean;
  loadingCities: boolean;
  loadingNeighborhoods: boolean;
}

function toOption(loc: {
  id: string;
  name: string;
  slug: string;
  geographic_path: string;
  type: LocationType;
}): LocationOption {
  return {
    id: loc.id,
    name: loc.name,
    slug: loc.slug,
    geographic_path: loc.geographic_path,
    type: loc.type,
  };
}

export async function fetchAllChildrenByType(
  parentId: string,
  type: LocationType,
): Promise<LocationOption[]> {
  const repo = createLocationRepository();
  const pageSize = LOCATION_PAGINATION.MAX_PAGE_SIZE;
  let page = 1;
  const items: LocationOption[] = [];

  while (true) {
    const result = await repo.findChildren(parentId, {
      type,
      status: LocationStatus.ACTIVE,
      page,
      page_size: pageSize,
    });

    items.push(...result.locations.map(toOption));

    if (result.locations.length < pageSize) {
      break;
    }
    page += 1;
  }

  return items.sort((a, b) => a.name.localeCompare(b.name));
}

export async function fetchSelectableLocalities(parentCityId: string): Promise<LocationOption[]> {
  const municipalNeighborhoods = await fetchAllChildrenByType(
    parentCityId,
    LocationType.NEIGHBORHOOD,
  );

  if (municipalNeighborhoods.length > 0) {
    return municipalNeighborhoods;
  }

  return fetchAllChildrenByType(parentCityId, LocationType.DISTRICT);
}

export function useCityLocalities(selectedCityId: string | null): {
  localities: LocationOption[];
  loadingLocalities: boolean;
} {
  const [localities, setLocalities] = useState<LocationOption[]>([]);
  const [loadingLocalities, setLoadingLocalities] = useState(false);

  useEffect(() => {
    if (!selectedCityId) {
      setLocalities([]);
      return;
    }

    setLoadingLocalities(true);
    setLocalities([]);

    fetchSelectableLocalities(selectedCityId)
      .then((result) => setLocalities(result))
      .catch(() => setLocalities([]))
      .finally(() => setLoadingLocalities(false));
  }, [selectedCityId]);

  return { localities, loadingLocalities };
}

export function useLocationCascade(
  selectedStateId: string | null,
  selectedCityId: string | null,
): UseLocationCascadeReturn {
  const [states, setStates] = useState<LocationOption[]>([]);
  const [cities, setCities] = useState<LocationOption[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<LocationOption[]>([]);
  const [loadingStates, setLoadingStates] = useState(true);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingNeighborhoods, setLoadingNeighborhoods] = useState(false);

  useEffect(() => {
    setLoadingStates(true);
    const repo = createLocationRepository();
    repo
      .findAll()
      .then((all) =>
        setStates(
          all
            .filter((l) => l.type === LocationType.STATE && l.status === LocationStatus.ACTIVE)
            .sort((a, b) => a.name.localeCompare(b.name))
            .map(toOption),
        ),
      )
      .catch(() => setStates([]))
      .finally(() => setLoadingStates(false));
  }, []);

  useEffect(() => {
    if (!selectedStateId) {
      setCities([]);
      setNeighborhoods([]);
      return;
    }

    setLoadingCities(true);
    setCities([]);
    setNeighborhoods([]);

    fetchAllChildrenByType(selectedStateId, LocationType.CITY)
      .then((result) => setCities(result))
      .catch(() => setCities([]))
      .finally(() => setLoadingCities(false));
  }, [selectedStateId]);

  useEffect(() => {
    if (!selectedCityId) {
      setNeighborhoods([]);
      return;
    }

    setLoadingNeighborhoods(true);
    setNeighborhoods([]);

    fetchSelectableLocalities(selectedCityId)
      .then((result) => setNeighborhoods(result))
      .catch(() => setNeighborhoods([]))
      .finally(() => setLoadingNeighborhoods(false));
  }, [selectedCityId]);

  return {
    states,
    cities,
    neighborhoods,
    loadingStates,
    loadingCities,
    loadingNeighborhoods,
  };
}
