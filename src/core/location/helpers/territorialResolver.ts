/**
 * TerritorialResolver - Helper compartilhado para resolução territorial
 * 
 * Evita duplicação de lógica de resolução cidade → districts/location_ids
 * em múltiplos services.
 */

import { logger } from '@/shared/utils/logger';
import { createLocationRepository } from '@/core/location/repositories/createLocationRepository';

export interface CityResolution {
  cityId: string;
  cityName: string;
  stateId: string;
  stateName: string;
  districtIds: string[];
}

/**
 * Resolve cidade por nome (state + city) para location_id e seus distritos
 * 
 * @param state - Nome ou sigla do estado (ex: "BA", "Bahia")
 * @param city - Nome da cidade (ex: "Salvador")
 * @returns CityResolution com cityId e districtIds, ou null se não encontrado
 */
export async function resolveCityToLocationIds(
  state: string,
  city: string
): Promise<CityResolution | null> {
  try {
    const locationRepository = createLocationRepository();
    const normalizedState = state.trim().toLowerCase();
    const normalizedCity = city.trim().toLowerCase();

    // 1. Buscar estado
    const allLocations = await locationRepository.findAll();
    const stateLocation = allLocations.find((location) => {
      if (location.type !== 'state' || location.status !== 'active') return false;
      const name = location.name?.trim().toLowerCase();
      const slug = location.slug?.trim().toLowerCase();
      return name === normalizedState || slug === normalizedState;
    });

    if (!stateLocation) {
      logger.warn('TerritorialResolver: Estado não encontrado', { state });
      return null;
    }

    // 2. Buscar cidade dentro do estado
    const cityChildren = await locationRepository.findChildren(stateLocation.id, {
      type: 'city',
      status: 'active',
      page: 1,
      page_size: 500,
    });
    const cityLocation = cityChildren.locations.find(
      (location) => location.name?.trim().toLowerCase() === normalizedCity,
    );

    if (!cityLocation) {
      logger.warn('TerritorialResolver: Cidade não encontrada', { state, city });
      return null;
    }

    // 3. Buscar todos os distritos (bairros) da cidade
    const districtChildren = await locationRepository.findChildren(cityLocation.id, {
      type: 'district',
      status: 'active',
      page: 1,
      page_size: 5000,
    });

    return {
      cityId: cityLocation.id,
      cityName: cityLocation.name,
      stateId: stateLocation.id,
      stateName: stateLocation.name,
      districtIds: districtChildren.locations.map((district) => district.id),
    };
  } catch (error) {
    logger.error('TerritorialResolver: Erro inesperado', error);
    return null;
  }
}

/**
 * Resolve bairro por nome dentro de uma cidade específica
 * 
 * IMPORTANTE: Sempre resolve dentro da cidade para evitar ambiguidade
 * (ex: "Centro" existe em múltiplas cidades)
 * 
 * @param state - Nome ou sigla do estado
 * @param city - Nome da cidade
 * @param neighborhood - Nome do bairro
 * @returns location_id do bairro, ou null se não encontrado
 */
export async function resolveNeighborhoodInCity(
  state: string,
  city: string,
  neighborhood: string
): Promise<string | null> {
  try {
    // 1. Resolver cidade primeiro
    const cityResolution = await resolveCityToLocationIds(state, city);
    if (!cityResolution) {
      return null;
    }

    // 2. Buscar bairro dentro da cidade
    const locationRepository = createLocationRepository();
    const districts = await locationRepository.findChildren(cityResolution.cityId, {
      type: 'district',
      status: 'active',
      page: 1,
      page_size: 5000,
    });
    const normalizedNeighborhood = neighborhood.trim().toLowerCase();
    const districtLocation = districts.locations.find(
      (location) => location.name?.trim().toLowerCase() === normalizedNeighborhood,
    );

    if (!districtLocation) {
      logger.warn('TerritorialResolver: Bairro não encontrado na cidade', {
        state,
        city,
        neighborhood,
      });
      return null;
    }

    return districtLocation.id;
  } catch (error) {
    logger.error('TerritorialResolver: Erro ao resolver bairro', error);
    return null;
  }
}

/**
 * Valida se um location_id pertence a uma cidade específica
 * 
 * @param locationId - ID da location a validar
 * @param state - Nome ou sigla do estado esperado
 * @param city - Nome da cidade esperada
 * @returns true se o location_id pertence à cidade, false caso contrário
 */
export async function validateLocationInCity(
  locationId: string,
  state: string,
  city: string
): Promise<boolean> {
  try {
    const cityResolution = await resolveCityToLocationIds(state, city);
    if (!cityResolution) {
      return false;
    }

    // Verificar se locationId é a própria cidade ou um de seus distritos
    if (locationId === cityResolution.cityId) {
      return true;
    }

    return cityResolution.districtIds.includes(locationId);
  } catch (error) {
    logger.error('TerritorialResolver: Erro ao validar location', error);
    return false;
  }
}
