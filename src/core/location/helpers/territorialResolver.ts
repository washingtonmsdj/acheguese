import { createLocationRepository } from "@/core/location/repositories/createLocationRepository";
import { LocationStatus, LocationType, type Location } from "@/core/location/types";
import { logger } from "@/shared/utils/logger";

export interface CityResolution {
  cityId: string;
  cityName: string;
  stateId: string;
  stateName: string;
  localityIds: string[];
  districtIds: string[];
}

export async function findSelectableLocalities(cityId: string): Promise<Location[]> {
  const locationRepository = createLocationRepository();
  const neighborhoods = await locationRepository.findChildren(cityId, {
    type: LocationType.NEIGHBORHOOD,
    status: LocationStatus.ACTIVE,
    page: 1,
    page_size: 5000,
  });

  if (neighborhoods.locations.length > 0) {
    return neighborhoods.locations;
  }

  const districts = await locationRepository.findChildren(cityId, {
    type: LocationType.DISTRICT,
    status: LocationStatus.ACTIVE,
    page: 1,
    page_size: 5000,
  });

  return districts.locations;
}

export async function resolveCityToLocationIds(
  state: string,
  city: string,
): Promise<CityResolution | null> {
  try {
    const locationRepository = createLocationRepository();
    const normalizedState = state.trim().toLowerCase();
    const normalizedCity = city.trim().toLowerCase();

    const allLocations = await locationRepository.findAll();
    const stateLocation = allLocations.find((location) => {
      if (location.type !== LocationType.STATE || location.status !== LocationStatus.ACTIVE) {
        return false;
      }
      const name = location.name?.trim().toLowerCase();
      const slug = location.slug?.trim().toLowerCase();
      return name === normalizedState || slug === normalizedState;
    });

    if (!stateLocation) {
      logger.warn("TerritorialResolver: Estado nao encontrado", { state });
      return null;
    }

    const cityChildren = await locationRepository.findChildren(stateLocation.id, {
      type: LocationType.CITY,
      status: LocationStatus.ACTIVE,
      page: 1,
      page_size: 5000,
    });
    const cityLocation = cityChildren.locations.find(
      (location) => location.name?.trim().toLowerCase() === normalizedCity,
    );

    if (!cityLocation) {
      logger.warn("TerritorialResolver: Cidade nao encontrada", { state, city });
      return null;
    }

    const selectableLocalities = await findSelectableLocalities(cityLocation.id);
    const localityIds = selectableLocalities.map((locality) => locality.id);

    return {
      cityId: cityLocation.id,
      cityName: cityLocation.name,
      stateId: stateLocation.id,
      stateName: stateLocation.name,
      localityIds,
      districtIds: localityIds,
    };
  } catch (error) {
    logger.error("TerritorialResolver: Erro inesperado", error);
    return null;
  }
}

export async function resolveNeighborhoodInCity(
  state: string,
  city: string,
  neighborhood: string,
): Promise<string | null> {
  try {
    const cityResolution = await resolveCityToLocationIds(state, city);
    if (!cityResolution) {
      return null;
    }

    const localities = await findSelectableLocalities(cityResolution.cityId);
    const normalizedNeighborhood = neighborhood.trim().toLowerCase();
    const localityLocation = localities.find(
      (location) => location.name?.trim().toLowerCase() === normalizedNeighborhood,
    );

    if (!localityLocation) {
      logger.warn("TerritorialResolver: Bairro nao encontrado na cidade", {
        state,
        city,
        neighborhood,
      });
      return null;
    }

    return localityLocation.id;
  } catch (error) {
    logger.error("TerritorialResolver: Erro ao resolver bairro", error);
    return null;
  }
}

export async function validateLocationInCity(
  locationId: string,
  state: string,
  city: string,
): Promise<boolean> {
  try {
    const cityResolution = await resolveCityToLocationIds(state, city);
    if (!cityResolution) {
      return false;
    }

    if (locationId === cityResolution.cityId) {
      return true;
    }

    return cityResolution.localityIds.includes(locationId);
  } catch (error) {
    logger.error("TerritorialResolver: Erro ao validar location", error);
    return false;
  }
}
