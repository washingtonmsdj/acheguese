// @ts-nocheck
/**
 * Rollout Repository Mock - In-Memory Implementation
 */

import type { IRolloutRepository } from './IRolloutRepository';
import type { ModuleRollout } from '../types';
import { ModuleKey, RolloutStatus, ROLLOUT_PAGINATION } from '../types';

export class RolloutRepositoryMock implements IRolloutRepository {
  private rollouts: Map<string, ModuleRollout> = new Map();
  private idCounter = 1;

  constructor() {
    this.seedInitialData();
  }

  /**
   * Seed: todos os módulos ativos em Salvador (cidade de lançamento).
   * Bairros herdam via RolloutService.resolveEffectiveRollout (ancestor lookup).
   */
  private seedInitialData(): void {
    const modules: ModuleKey[] = [
      ModuleKey.COMMUNITY,
      ModuleKey.BUSINESS,
      ModuleKey.SERVICES,
      ModuleKey.MOBILITY,
      ModuleKey.CLASSIFIEDS,
      ModuleKey.PROMOTIONS,
    ];
    const now = new Date().toISOString();

    modules.forEach((module_key, i) => {
      const location_id = 'loc-salvador';
      const key = this.getKey(module_key, location_id);
      this.rollouts.set(key, {
        id: `rollout-seed-${i + 1}`,
        module_key,
        location_id,
        status: 'active' as RolloutStatus,
        config: null,
        created_at: now,
        updated_at: now,
      });
    });
  }

  private getKey(module_key: ModuleKey, location_id: string): string {
    return `${module_key}:${location_id}`;
  }

  async findByModuleAndLocation(
    module_key: ModuleKey,
    location_id: string
  ): Promise<ModuleRollout | null> {
    const key = this.getKey(module_key, location_id);
    return this.rollouts.get(key) || null;
  }

  async findByModuleAndLocations(
    module_key: ModuleKey,
    location_ids: string[]
  ): Promise<Map<string, ModuleRollout>> {
    const result = new Map<string, ModuleRollout>();
    for (const location_id of location_ids) {
      const key = this.getKey(module_key, location_id);
      const rollout = this.rollouts.get(key);
      if (rollout) result.set(location_id, rollout);
    }
    return result;
  }

  async findByModule(
    module_key: ModuleKey,
    options: {
      status?: RolloutStatus;
      page?: number;
      page_size?: number;
    }
  ): Promise<{ rollouts: ModuleRollout[]; total_count: number }> {
    const page = options.page || ROLLOUT_PAGINATION.DEFAULT_PAGE;
    const page_size = options.page_size || ROLLOUT_PAGINATION.DEFAULT_PAGE_SIZE;

    let results = Array.from(this.rollouts.values()).filter(
      (r) => r.module_key === module_key
    );

    if (options.status) {
      results = results.filter((r) => r.status === options.status);
    }

    const total_count = results.length;
    const start = (page - 1) * page_size;
    const end = start + page_size;
    const paginated = results.slice(start, end);

    return { rollouts: paginated, total_count };
  }

  async findByLocation(location_id: string): Promise<ModuleRollout[]> {
    return Array.from(this.rollouts.values()).filter(
      (r) => r.location_id === location_id
    );
  }

  async upsert(
    module_key: ModuleKey,
    location_id: string,
    status: RolloutStatus,
    config?: Record<string, unknown>,
    user_id?: string
  ): Promise<ModuleRollout> {
    const key = this.getKey(module_key, location_id);
    const existing = this.rollouts.get(key);
    const now = new Date().toISOString();

    if (existing) {
      existing.status = status;
      existing.config = config || null;
      existing.updated_at = now;
      return existing;
    }

    const id = `rollout-${this.idCounter++}`;
    const rollout: ModuleRollout = {
      id,
      module_key,
      location_id,
      status,
      config: config || null,
      created_at: now,
      updated_at: now,
    };

    this.rollouts.set(key, rollout);
    return rollout;
  }

  async delete(module_key: ModuleKey, location_id: string): Promise<void> {
    const key = this.getKey(module_key, location_id);
    this.rollouts.delete(key);
  }
}
