/**
 * TerritoryGovernanceService
 * 
 * SSOT para governança territorial e postal.
 * 
 * Responsabilidades:
 * - Versionamento de locations
 * - Aliases históricos e populares
 * - Eventos de mudança territorial
 * - Histórico postal
 * 
 * Regras:
 * - Versão ativa: valid_until IS NULL ou ainda vigente
 * - Alias não pode ser ambíguo
 * - Eventos registram mudanças oficiais
 */

import type { IGovernanceRepository } from '../repositories/IGovernanceRepository';
import { createGovernanceRepository } from '../repositories/createGovernanceRepository';
import type { ILocationRepository } from '@/core/location/repositories/ILocationRepository';
import { createLocationRepository } from '@/core/location/repositories/createLocationRepository';
import type {
  LocationVersion,
  CreateLocationVersionInput,
  LocationAlias,
  CreateLocationAliasInput,
  TerritoryChangeEvent,
  CreateTerritoryChangeEventInput,
  PostalCodeHistory,
  CreatePostalCodeHistoryInput,
} from '../types';

export class TerritoryGovernanceService {
  private repository: IGovernanceRepository;
  private locationRepository: ILocationRepository;

  constructor(repository?: IGovernanceRepository, locationRepository?: ILocationRepository) {
    this.repository = repository ?? createGovernanceRepository();
    this.locationRepository = locationRepository ?? createLocationRepository();
  }

  // ============================================
  // LOCATION VERSIONS
  // ============================================

  /**
   * Criar nova versão de location
   * 
   * Regra: Location deve existir
   */
  async createLocationVersion(input: CreateLocationVersionInput): Promise<LocationVersion> {
    if (!input.location_id || !input.name || !input.slug || !input.valid_from) {
      throw new Error('location_id, name, slug, and valid_from are required');
    }

    const location = await this.locationRepository.findById(input.location_id);
    if (!location) {
      throw new Error(`Location ${input.location_id} not found`);
    }

    return await this.repository.createLocationVersion(input);
  }

  /**
   * Obter versão ativa de uma location
   */
  async getActiveVersionForLocation(locationId: string): Promise<LocationVersion | null> {
    if (!locationId) {
      throw new Error('Location ID is required');
    }
    return await this.repository.getActiveVersionForLocation(locationId);
  }

  /**
   * Listar todas as versões de uma location
   */
  async listVersionsForLocation(locationId: string): Promise<LocationVersion[]> {
    if (!locationId) {
      throw new Error('Location ID is required');
    }
    return await this.repository.listVersionsForLocation(locationId);
  }

  // ============================================
  // LOCATION ALIASES
  // ============================================

  /**
   * Adicionar alias para location
   * 
   * Regras:
   * - Location deve existir
   * - Alias não pode ser duplicado para mesma location
   */
  async addLocationAlias(input: CreateLocationAliasInput): Promise<LocationAlias> {
    if (!input.location_id || !input.alias_type || !input.alias_value) {
      throw new Error('location_id, alias_type, and alias_value are required');
    }

    const location = await this.locationRepository.findById(input.location_id);
    if (!location) {
      throw new Error(`Location ${input.location_id} not found`);
    }

    return await this.repository.createLocationAlias(input);
  }

  /**
   * Resolver location por alias ou slug atual
   * 
   * Busca primeiro por alias ativo, depois por slug atual em locations.
   */
  async resolveLocationByAliasOrCurrentSlug(value: string): Promise<string | null> {
    if (!value) {
      throw new Error('Value is required');
    }

    // Tentar resolver por alias
    const locationIdByAlias = await this.repository.findLocationByAlias(value);
    if (locationIdByAlias) {
      return locationIdByAlias;
    }

    // Tentar resolver por slug atual (buscar em locations)
    // Nota: Isso requer busca por slug em locations, que pode ser ambíguo
    // Para resolver corretamente, precisaria de contexto (parent_id)
    // Por ora, retornamos null se não encontrar por alias
    return null;
  }

  /**
   * Listar aliases de uma location
   */
  async listAliasesForLocation(locationId: string): Promise<LocationAlias[]> {
    if (!locationId) {
      throw new Error('Location ID is required');
    }
    return await this.repository.listAliasesForLocation(locationId);
  }

  // ============================================
  // TERRITORY CHANGE EVENTS
  // ============================================

  /**
   * Registrar evento de mudança territorial
   * 
   * Regra: Location deve existir
   */
  async registerTerritoryChangeEvent(input: CreateTerritoryChangeEventInput): Promise<TerritoryChangeEvent> {
    if (!input.location_id || !input.event_type || !input.official_source || !input.effective_date) {
      throw new Error('location_id, event_type, official_source, and effective_date are required');
    }

    const location = await this.locationRepository.findById(input.location_id);
    if (!location) {
      throw new Error(`Location ${input.location_id} not found`);
    }

    return await this.repository.createTerritoryChangeEvent(input);
  }

  /**
   * Listar eventos de uma location
   */
  async listEventsForLocation(locationId: string): Promise<TerritoryChangeEvent[]> {
    if (!locationId) {
      throw new Error('Location ID is required');
    }
    return await this.repository.listEventsForLocation(locationId);
  }

  // ============================================
  // POSTAL CODE HISTORY
  // ============================================

  /**
   * Registrar histórico postal
   * 
   * Regra: Location deve existir
   */
  async registerPostalCodeHistory(input: CreatePostalCodeHistoryInput): Promise<PostalCodeHistory> {
    if (!input.location_id || !input.postal_code || !input.valid_from) {
      throw new Error('location_id, postal_code, and valid_from are required');
    }

    const location = await this.locationRepository.findById(input.location_id);
    if (!location) {
      throw new Error(`Location ${input.location_id} not found`);
    }

    return await this.repository.createPostalCodeHistory(input);
  }

  /**
   * Listar histórico postal de uma location
   */
  async listPostalCodeHistoryForLocation(locationId: string): Promise<PostalCodeHistory[]> {
    if (!locationId) {
      throw new Error('Location ID is required');
    }
    return await this.repository.listPostalCodeHistoryForLocation(locationId);
  }
}

export const territoryGovernanceService = new TerritoryGovernanceService();
