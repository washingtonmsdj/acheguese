import { createLocationRepository } from "@/core/location/repositories/createLocationRepository";
import { LocationStatus, LocationType, type Location } from "@/core/location/types";
import { logger } from "@/shared/utils/logger";
import { slugifyTerritory } from "@/shared/utils/slugify";

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
    const normalizedState = slugifyTerritory(state);
    const normalizedCity = slugifyTerritory(city);

    // O caminho territorial é único e indexado. O resolver não deve carregar
    // a árvore nacional inteira para localizar uma UF.
    let stateLocation = await locationRepository.findByPath(`/br/${normalizedState}`);
    if (
      !stateLocation &&
      locationRepository.findActiveStateByName &&
      state.trim().length > 2
    ) {
      stateLocation = await locationRepository.findActiveStateByName(state);
    }

    if (
      !stateLocation ||
      stateLocation.type !== LocationType.STATE ||
      stateLocation.status !== LocationStatus.ACTIVE
    ) {
      logger.warn("TerritorialResolver: Estado nao encontrado", { state });
      return null;
    }

    const cityLocation = await locationRepository.findByPath(
      `/br/${stateLocation.slug}/${normalizedCity}`,
    );

    if (
      !cityLocation ||
      cityLocation.type !== LocationType.CITY ||
      cityLocation.status !== LocationStatus.ACTIVE
    ) {
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
