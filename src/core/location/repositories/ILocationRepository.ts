/**
 * Location Repository - Interface
 * 
 * Contrato de persistência para locations.
 */

import type { Location, LocationType, LocationStatus } from '../types';

export interface ILocationRepository {
  /**
   * Busca localização por ID
   */
  findById(id: string): Promise<Location | null>;

  /**
   * Busca localização por path geográfico
   */
  findByPath(path: string): Promise<Location | null>;

  /**
   * Busca localização por slug dentro de um parent
   */
  findBySlugWithinParent(slug: string, parent_id: string): Promise<Location | null>;

  /**
   * Busca ancestrais de uma localização
   */
  findAncestors(location_id: string, include_self?: boolean): Promise<Location[]>;

  /**
   * Busca descendentes de uma localização (paginado)
   */
  findDescendants(
    location_id: string,
    options: {
      include_self?: boolean;
      max_depth?: number;
      page?: number;
      page_size?: number;
    }
  ): Promise<{ locations: Location[]; total_count: number }>;

  /**
   * Busca filhos diretos de uma localização (paginado)
   */
  findChildren(
    location_id: string,
    options: {
      type?: LocationType;
      status?: LocationStatus;
      page?: number;
      page_size?: number;
    }
  ): Promise<{ locations: Location[]; total_count: number }>;

  /**
   * Busca todas as localizações (para construir árvore)
   */
  findAll(): Promise<Location[]>;
}
