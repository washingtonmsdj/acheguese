import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCityMetadata } from "@/core/city/hooks/useCityMetadata";
import { createLocationRepository } from "@/core/location/repositories/createLocationRepository";
import { locationContextStore } from "@/core/location/stores/LocationContextStore";
import { TERRITORY_CONFIG } from "@/core/routing/config/territory";
import { LocationStatus, LocationType, type Location } from "@/core/location/types";

function slugFromName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function useOnboarding() {
  const navigate = useNavigate();
  const [selectedNeighborhood, setSelectedNeighborhood] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [neighborhoods, setNeighborhoods] = useState<Location[]>([]);
  const [cityLocation, setCityLocation] = useState<Location | null>(null);
  const [isLoadingLocations, setIsLoadingLocations] = useState(true);
  const { data: cityMetadata } = useCityMetadata(
    TERRITORY_CONFIG.launch.state,
    TERRITORY_CONFIG.launch.city,
  );

  useEffect(() => {
    let cancelled = false;

    async function loadLocations() {
      setIsLoadingLocations(true);
      try {
        const repository = createLocationRepository();
        const cityPath = `/${TERRITORY_CONFIG.launch.country}/${TERRITORY_CONFIG.launch.state}/${TERRITORY_CONFIG.launch.city}`;
        const city = await repository.findByPath(cityPath);
        if (!city) {
          if (!cancelled) {
            setCityLocation(null);
            setNeighborhoods([]);
          }
          return;
        }

        const municipalNeighborhoods = await repository.findChildren(city.id, {
          type: LocationType.NEIGHBORHOOD,
          status: LocationStatus.ACTIVE,
          page_size: 200,
        });
        const fallbackDistricts =
          municipalNeighborhoods.locations.length > 0
            ? { locations: [] }
            : await repository.findChildren(city.id, {
                type: LocationType.DISTRICT,
                status: LocationStatus.ACTIVE,
                page_size: 200,
              });

        if (!cancelled) {
          setCityLocation(city);
          setNeighborhoods(
            municipalNeighborhoods.locations.length > 0
              ? municipalNeighborhoods.locations
              : fallbackDistricts.locations,
          );
        }
      } finally {
        if (!cancelled) setIsLoadingLocations(false);
      }
    }

    loadLocations();
    return () => {
      cancelled = true;
    };
  }, []);

  const neighborhoodNames = useMemo(
    () => neighborhoods.map((neighborhood) => neighborhood.name),
    [neighborhoods],
  );

  const handleNeighborhoodSelect = (neighborhood: string) => {
    setSelectedNeighborhood(neighborhood);
  };

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      if (selectedNeighborhood && cityLocation) {
        const repository = createLocationRepository();
        const location = await repository.findBySlugWithinParent(
          slugFromName(selectedNeighborhood),
          cityLocation.id,
        );
        if (location) {
          locationContextStore.setActiveLocation(location);
        }
      } else if (cityLocation) {
        locationContextStore.setActiveLocation(cityLocation);
      }
    } finally {
      setIsLoading(false);
    }

    navigate(`/${TERRITORY_CONFIG.launch.state}/${TERRITORY_CONFIG.launch.city}`);
  };

  return {
    neighborhoods: neighborhoodNames,
    populationTotal: cityMetadata?.population ?? 0,
    neighborhoodsCount: neighborhoods.length,
    cityName: cityMetadata?.city ?? cityLocation?.name ?? TERRITORY_CONFIG.launch.name,
    stateName: cityMetadata?.state ?? TERRITORY_CONFIG.launch.state.toUpperCase(),
    selectedNeighborhood,
    onNeighborhoodSelect: handleNeighborhoodSelect,
    onConfirm: handleConfirm,
    canConfirm: neighborhoods.length === 0 || Boolean(selectedNeighborhood),
    isLoading: isLoading || isLoadingLocations,
  };
}
