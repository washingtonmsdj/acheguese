/**
 * Rollout Service - Implementation
 */

import type { IRolloutService } from './IRolloutService';
import type { IRolloutRepository } from '../repositories/IRolloutRepository';
import type { ILocationRepository } from '@/core/location/repositories/ILocationRepository';
import type {
  IsModuleActiveInput,
  GetEffectiveRolloutInput,
  GetActiveModulesInput,
  GetLocationsForModuleInput,
  SetModuleRolloutInput,
  RemoveModuleRolloutInput,
  GetModuleConfigInput,
  IsModuleActiveOutput,
  GetEffectiveRolloutOutput,
  GetActiveModulesOutput,
  GetLocationsForModuleOutput,
  SetModuleRolloutOutput,
  GetModuleConfigOutput,
  EffectiveRollout,
} from '../types';
import { ModuleKey, RolloutErrorCode, RolloutSource, RolloutStatus } from '../types';
import { ROLLOUT_PAGINATION } from '../types';
import { RolloutError } from '../errors/RolloutError';

export class RolloutService implements IRolloutService {
  constructor(
    private repository: IRolloutRepository,
    private locationRepository: ILocationRepository
  ) {}

  async isModuleActive(input: IsModuleActiveInput): Promise<IsModuleActiveOutput> {
    const effective_rollout = await this.resolveEffectiveRollout(input.module_key, input.location_id);

    return {
      is_active: effective_rollout.status === RolloutStatus.ACTIVE,
      effective_rollout,
    };
  }

  async getEffectiveRollout(input: GetEffectiveRolloutInput): Promise<GetEffectiveRolloutOutput> {
    const effective_rollout = await this.resolveEffectiveRollout(input.module_key, input.location_id);

    return { effective_rollout };
  }

  async getActiveModules(input: GetActiveModulesInput): Promise<GetActiveModulesOutput> {
    const location = await this.locationRepository.findById(input.location_id);

    if (!location) {
      throw this.createError(RolloutErrorCode.LOCATION_NOT_FOUND, `Location ${input.location_id} not found`);
    }

    // Buscar rollouts locais
    const localRollouts = await this.repository.findByLocation(input.location_id);

    // Para cada módulo possível, resolver rollout efetivo
    const moduleKeys: ModuleKey[] = [
      ModuleKey.COMMUNITY,
      ModuleKey.BUSINESS,
      ModuleKey.SERVICES,
      ModuleKey.MOBILITY,
      ModuleKey.CLASSIFIEDS,
      ModuleKey.PROMOTIONS,
    ];
    const modules: EffectiveRollout[] = [];

    for (const module_key of moduleKeys) {
      const effective = await this.resolveEffectiveRollout(module_key, input.location_id);
      if (effective.status === RolloutStatus.ACTIVE) {
        modules.push(effective);
      }
    }

    return {
      modules,
      count: modules.length,
    };
  }

  async getLocationsForModule(input: GetLocationsForModuleInput): Promise<GetLocationsForModuleOutput> {
    const page = input.page || ROLLOUT_PAGINATION.DEFAULT_PAGE;
    const page_size = Math.min(
      input.page_size || ROLLOUT_PAGINATION.DEFAULT_PAGE_SIZE,
      ROLLOUT_PAGINATION.MAX_PAGE_SIZE
    );

    const result = await this.repository.findByModule(input.module_key, {
      status: input.status,
      page,
      page_size,
    });

    const location_ids = result.rollouts.map((r) => r.location_id);

    return {
      location_ids,
      total_count: result.total_count,
      page,
      page_size,
      has_more: page * page_size < result.total_count,
    };
  }

  async setModuleRollout(input: SetModuleRolloutInput): Promise<SetModuleRolloutOutput> {
    // Validar location existe e está ativa
    const location = await this.locationRepository.findById(input.location_id);

    if (!location) {
      throw this.createError(RolloutErrorCode.LOCATION_NOT_FOUND, `Location ${input.location_id} not found`);
    }

    if (location.status !== 'active') {
      throw this.createError(RolloutErrorCode.LOCATION_INACTIVE, `Location ${input.location_id} is not active`);
    }

    // Validar config se fornecido
    if (input.config && typeof input.config !== 'object') {
      throw this.createError(RolloutErrorCode.INVALID_CONFIG, 'Config must be an object');
    }

    const rollout = await this.repository.upsert(
      input.module_key,
      input.location_id,
      input.status,
      input.config
    );

    return { rollout };
  }

  async removeModuleRollout(input: RemoveModuleRolloutInput): Promise<void> {
    const existing = await this.repository.findByModuleAndLocation(input.module_key, input.location_id);

    if (!existing) {
      throw this.createError(
        RolloutErrorCode.ROLLOUT_NOT_FOUND,
        `Rollout for ${input.module_key} in ${input.location_id} not found`
      );
    }

    await this.repository.delete(input.module_key, input.location_id);
  }

  async getModuleConfig(input: GetModuleConfigInput): Promise<GetModuleConfigOutput> {
    const effective = await this.resolveEffectiveRollout(input.module_key, input.location_id);

    return {
      config: effective.config,
      source: effective.source,
    };
  }

  /**
   * Resolve rollout efetivo com herança
   * 
   * Precedência:
   * 1. LOCAL: rollout explícito na localização
   * 2. INHERITED: rollout do ancestor mais próximo
   * 3. DEFAULT: false (módulo desativado)
   */
  private async resolveEffectiveRollout(
    module_key: ModuleKey,
    location_id: string
  ): Promise<EffectiveRollout> {
    // Validar location existe
    const location = await this.locationRepository.findById(location_id);

    if (!location) {
      throw this.createError(RolloutErrorCode.LOCATION_NOT_FOUND, `Location ${location_id} not found`);
    }

    // Location inativa bloqueia rollout efetivo
    if (location.status !== 'active') {
      return {
        module_key,
        location_id,
        status: RolloutStatus.INACTIVE,
        config: null,
        source: RolloutSource.DEFAULT,
        inherited_from: null,
      };
    }

    // 1. Buscar rollout LOCAL
    const localRollout = await this.repository.findByModuleAndLocation(module_key, location_id);

    if (localRollout) {
      return {
        module_key: localRollout.module_key,
        location_id: localRollout.location_id,
        status: localRollout.status,
        config: localRollout.config,
        source: RolloutSource.LOCAL,
        inherited_from: null,
      };
    }

    // 2. Buscar rollout INHERITED (ancestors)
    const ancestors = await this.locationRepository.findAncestors(location_id, false);

    for (const ancestor of ancestors) {
      // Pular ancestors inativos
      if (ancestor.status !== 'active') continue;

      const ancestorRollout = await this.repository.findByModuleAndLocation(module_key, ancestor.id);

      if (ancestorRollout) {
        return {
          module_key: ancestorRollout.module_key,
          location_id,
          status: ancestorRollout.status,
          config: ancestorRollout.config,
          source: RolloutSource.INHERITED,
          inherited_from: ancestor.id,
        };
      }
    }

    // 3. DEFAULT: false (módulo desativado)
    return {
      module_key,
      location_id,
      status: RolloutStatus.INACTIVE,
      config: null,
      source: RolloutSource.DEFAULT,
      inherited_from: null,
    };
  }

  private createError(code: RolloutErrorCode, message: string, details?: Record<string, unknown>): RolloutError {
    return new RolloutError(code, message, details);
  }
}
