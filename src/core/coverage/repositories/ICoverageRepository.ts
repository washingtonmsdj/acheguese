/**
 * Coverage Repository - Interface
 * 
 * Contrato de persistência para service_areas.
 */

import type { ServiceArea, EntityType, CoverageStatus } from '../types';

export interface ICoverageRepository {
  /**
   * Cria múltiplas coberturas (transação)
   */
  replaceByEntity(
    entity_type: EntityType,
    entity_id: string,
    coverages: Omit<
      ServiceArea,
      'id' | 'entity_type' | 'entity_id' | 'created_at' | 'updated_at'
    >[],
  ): Promise<ServiceArea[]>;

  /**
   * Busca coberturas de uma entidade
   */
  findByEntity(
    entity_type: EntityType,
    entity_id: string,
    status?: CoverageStatus
  ): Promise<ServiceArea[]>;

  /**
   * Busca cobertura primária de uma entidade
   */
  findPrimaryByEntity(
    entity_type: EntityType,
    entity_id: string
  ): Promise<ServiceArea | null>;

  /**
   * Busca entidades que cobrem uma localização (paginado)
   */
  findEntitiesCovering(
    entity_type: EntityType,
    location_id: string,
    options: {
      status?: CoverageStatus;
      page?: number;
      page_size?: number;
    }
  ): Promise<{ entity_ids: string[]; total_count: number }>;

  /**
   * Remove coberturas de uma entidade
   */
  deleteByEntity(
    entity_type: EntityType,
    entity_id: string,
    coverage_id?: string
  ): Promise<number>;

  /**
   * Atualiza status de uma cobertura
   */
  updateStatus(coverage_id: string, status: CoverageStatus): Promise<void>;

  /**
   * Busca cobertura por ID
   */
  findById(coverage_id: string): Promise<ServiceArea | null>;
}
