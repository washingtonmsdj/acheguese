/**
 * BaseLocationService
 *
 * Núcleo compartilhado entre TODOS os módulos que integram a fundação geográfica.
 * Contém lógica comum para community, business, services, classifieds E mobility.
 *
 * NÃO usar diretamente — estender em cada módulo.
 * 
 * SSOT: Todos os LocationServices devem estender esta classe.
 */

import { locationContextStore } from '@/core/location/stores/LocationContextStore';
import { LocationService } from '@/core/location/services/LocationService';
import { createLocationRepository } from '@/core/location/repositories/createLocationRepository';
import { LocationStatus, LocationType } from '@/core/location/types/index';
import type { Location, TerritoryFilter } from '@/core/location/types/index';

export abstract class BaseLocationService {
  protected locationService: LocationService;

  constructor() {
    // Usa a factory canônica de locations; produção e desenvolvimento seguem o mesmo contrato.
    this.locationService = new LocationService(createLocationRepository());
  }

  /** Localização ativa do contexto do app */
  getActiveLocation(): Location | null {
    return locationContextStore.getActiveLocation();
  }

  /** Subscreve a mudanças de localização. Retorna cleanup. */
  subscribe(listener: () => void): () => void {
    return locationContextStore.subscribe(listener);
  }

  /** location_id bruto do contexto */
  getActiveLocationId(): string | null {
    return this.getActiveLocation()?.id || null;
  }

  /** Verifica se há localização ativa */
  hasActiveLocation(): boolean {
    return this.getActiveLocation() !== null;
  }

  /** Nome da localização ativa para exibição */
  getActiveLocationName(): string | null {
    return this.getActiveLocation()?.name || null;
  }

  /** Verifica se localização ativa é cidade */
  isCity(): boolean {
    return this.getActiveLocation()?.type === LocationType.CITY;
  }

  /** Verifica se localização ativa é distrito */
  isDistrict(): boolean {
    const type = this.getActiveLocation()?.type;
    return type === LocationType.DISTRICT || type === LocationType.NEIGHBORHOOD;
  }

  /** Valida se um location_id é válido e ativo na fundação */
  async validateLocationId(locationId: string): Promise<boolean> {
    try {
      const result = await this.locationService.validateLocation({
        location_id: locationId,
        required_status: LocationStatus.ACTIVE,
      });
      return result.is_valid;
    } catch {
      return false;
    }
  }

  /**
   * Obtém location_id operacional para filtros.
   * 
   * Comportamento padrão: retorna location_id ativo.
   * Mobility override: promove district → city (rotas cruzam bairros).
   * 
   * @returns location_id para usar em queries
   */
  async getOperationalLocationId(): Promise<string | null> {
    return this.getActiveLocationId();
  }

  /**
   * Escopo de filtro padrão: district → 'district', city → 'city'.
   * Mobility sobrescreve isso com regra própria (sempre 'city').
   */
  getFilterScope(): 'city' | 'district' | 'none' {
    const location = this.getActiveLocation();
    if (!location) return 'none';
    if (location.type === LocationType.DISTRICT || location.type === LocationType.NEIGHBORHOOD) return 'district';
    if (location.type === LocationType.CITY) return 'city';
    return 'city';
  }

  /**
   * Comportamento padrão quando não há localização ativa.
   * Cada módulo pode customizar a mensagem.
   */
  abstract getDefaultBehavior(): {
    allowListing: boolean;
    showMessage: string;
    filterScope: 'none';
  };

  /**
   * Retorna o TerritoryFilter canônico para uso em queries.
   *
   * Este método resolve apenas a partir do LocationContextStore (location ativa).
   * Para suporte a grupos territoriais, usar useTerritoryFilter() com routeResolved.
   *
   * scope: 'location' → eq(location_id, id)
   * scope: 'none'     → sem filtro (território não resolvido)
   */
  getTerritoryFilter(): TerritoryFilter {
    const location = this.getActiveLocation();
    if (!location) return { scope: 'none' };
    return { scope: 'location', location_id: location.id };
  }

}
