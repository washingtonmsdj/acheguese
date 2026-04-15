/**
 * Rollout Repository - Interface
 * 
 * Contrato de persistência para module_rollouts.
 */

import type { ModuleRollout, ModuleKey, RolloutStatus } from '../types';

export interface IRolloutRepository {
  /**
   * Busca rollout por módulo e localização
   */
  findByModuleAndLocation(
    module_key: ModuleKey,
    location_id: string
  ): Promise<ModuleRollout | null>;

  /**
   * Busca rollouts de um módulo para múltiplas localizações (batch).
   * Usado por GroupAvailabilityService para evitar N queries individuais.
   */
  findByModuleAndLocations(
    module_key: ModuleKey,
    location_ids: string[]
  ): Promise<Map<string, ModuleRollout>>;

  /**
   * Busca rollouts de um módulo (paginado)
   */
  findByModule(
    module_key: ModuleKey,
    options: {
      status?: RolloutStatus;
      page?: number;
      page_size?: number;
    }
  ): Promise<{ rollouts: ModuleRollout[]; total_count: number }>;

  /**
   * Busca rollouts de uma localização
   */
  findByLocation(location_id: string): Promise<ModuleRollout[]>;

  /**
   * Cria ou atualiza rollout
   */
  upsert(
    module_key: ModuleKey,
    location_id: string,
    status: RolloutStatus,
    config?: Record<string, unknown>,
    user_id?: string
  ): Promise<ModuleRollout>;

  /**
   * Remove rollout
   */
  delete(module_key: ModuleKey, location_id: string): Promise<void>;
}
