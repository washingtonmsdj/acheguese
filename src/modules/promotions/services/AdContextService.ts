/**
 * AdContextService
 *
 * Constrói o AdEligibilityContext a partir da fundação geográfica.
 * Responsável por:
 * - Ler localização ativa do locationContextStore
 * - Resolver parent_city_id quando active é district
 * - Aceitar fallback_location_id do perfil
 *
 * Não usa strings de bairro/cidade.
 * Não usa CoverageService.
 */

import { locationContextStore } from '@/core/location';
import { LocationService } from '@/core/location/services/LocationService';
import { createLocationRepository } from '@/core/location/repositories/createLocationRepository';
import type { ILocationRepository } from '@/core/location/repositories/ILocationRepository';
import type { AdEligibilityContext } from '../types';
import type { Location } from '@/core/location/types';

export class AdContextService {
  private locationService: LocationService;

  constructor(locationRepository: ILocationRepository = createLocationRepository()) {
    this.locationService = new LocationService(locationRepository);
  }

  /**
   * Constrói o contexto de elegibilidade para resolução de anúncios.
   * @param fallbackLocationId - primary_location_id do perfil, se disponível
   */
  async buildContext(fallbackLocationId?: string | null): Promise<AdEligibilityContext> {
    const activeLocation = locationContextStore.getActiveLocation();

    if (!activeLocation) {
      return {
        active_location_id: null,
        active_location_type: null,
        parent_city_id: null,
        fallback_location_id: fallbackLocationId || null,
      };
    }

    const locationType = activeLocation.type as string;
    const isDistrict = locationType === 'district';
    const isCity = locationType === 'city';

    let parent_city_id: string | null = null;

    if (isDistrict && activeLocation.parent_id) {
      // Resolver city pai do district
      parent_city_id = await this.resolveParentCityId(activeLocation);
    }

    return {
      active_location_id: activeLocation.id,
      active_location_type: isDistrict ? 'district' : isCity ? 'city' : null,
      parent_city_id,
      fallback_location_id: fallbackLocationId || null,
    };
  }

  /**
   * Resolve o ID da city pai de um district.
   * Sobe na hierarquia até encontrar uma location do tipo city.
   */
  private async resolveParentCityId(district: Location): Promise<string | null> {
    try {
      const { ancestors } = await this.locationService.getAncestors({
        location_id: district.id,
        include_self: false,
      });

      const cityAncestor = ancestors.find((a) => a.type === 'city');
      return cityAncestor?.id || null;
    } catch {
      return null;
    }
  }

  /** Retorna a localização ativa atual (conveniência) */
  getActiveLocation(): Location | null {
    return locationContextStore.getActiveLocation();
  }

  /** Retorna o ID da localização ativa */
  getActiveLocationId(): string | null {
    return this.getActiveLocation()?.id || null;
  }

  /** Verifica se há localização ativa */
  hasActiveLocation(): boolean {
    return this.getActiveLocation() !== null;
  }
}

export const adContextService = new AdContextService();
