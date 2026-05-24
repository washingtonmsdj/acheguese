/**
 * RolloutRepositorySupabase
 *
 * Implementação real de IRolloutRepository usando Supabase.
 *
 * STATUS: implementação canônica; depende da migration de module_rollouts no ambiente.
 *
 * Schema versionado exclusivamente em supabase/migrations.
 */

import { supabase } from '@/integrations/supabase';
import { RolloutErrorCode } from '../types/index';
import { RolloutError } from '../errors/RolloutError';
import type { IRolloutRepository } from './IRolloutRepository';
import type { ModuleRollout, ModuleKey, RolloutStatus } from '../types/index';
import { ROLLOUT_PAGINATION } from '../types/index';

const TABLE = 'module_rollouts';

function rowToRollout(row: Record<string, unknown>): ModuleRollout {
  return {
    id: row.id as string,
    module_key: row.module_key as ModuleKey,
    location_id: row.location_id as string,
    status: row.status as RolloutStatus,
    config: (row.config as ModuleRollout['config']) ?? null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

export class RolloutRepositorySupabase implements IRolloutRepository {
  async findByModuleAndLocation(
    module_key: ModuleKey,
    location_id: string
  ): Promise<ModuleRollout | null> {
    const { data, error } = await (supabase as any)
      .from(TABLE)
      .select('*')
      .eq('module_key', module_key)
      .eq('location_id', location_id)
      .maybeSingle();

    if (error) throw new RolloutError(RolloutErrorCode.DATABASE_ERROR, error.message);
    if (!data) return null;
    return rowToRollout(data);
  }

  async findByModuleAndLocations(
    module_key: ModuleKey,
    location_ids: string[]
  ): Promise<Map<string, ModuleRollout>> {
    if (location_ids.length === 0) return new Map();

    const { data, error } = await (supabase as any)
      .from(TABLE)
      .select('*')
      .eq('module_key', module_key)
      .in('location_id', location_ids);

    if (error) throw new RolloutError(RolloutErrorCode.DATABASE_ERROR, error.message);

    const result = new Map<string, ModuleRollout>();
    for (const row of data ?? []) {
      const rollout = rowToRollout(row);
      result.set(rollout.location_id, rollout);
    }
    return result;
  }

  async findByModule(
    module_key: ModuleKey,
    options: { status?: RolloutStatus; page?: number; page_size?: number }
  ): Promise<{ rollouts: ModuleRollout[]; total_count: number }> {
    const page = options.page ?? ROLLOUT_PAGINATION.DEFAULT_PAGE;
    const page_size = options.page_size ?? ROLLOUT_PAGINATION.DEFAULT_PAGE_SIZE;
    const offset = (page - 1) * page_size;

    let query = (supabase as any)
      .from(TABLE)
      .select('*', { count: 'exact' })
      .eq('module_key', module_key)
      .order('created_at', { ascending: false })
      .range(offset, offset + page_size - 1);

    if (options.status) {
      query = query.eq('status', options.status);
    }

    const { data, error, count } = await query;
    if (error) throw new RolloutError(RolloutErrorCode.DATABASE_ERROR, error.message);

    return {
      rollouts: (data ?? []).map(rowToRollout),
      total_count: count ?? 0,
    };
  }

  async findByLocation(location_id: string): Promise<ModuleRollout[]> {
    const { data, error } = await (supabase as any)
      .from(TABLE)
      .select('*')
      .eq('location_id', location_id)
      .order('module_key', { ascending: true });

    if (error) throw new RolloutError(RolloutErrorCode.DATABASE_ERROR, error.message);
    return (data ?? []).map(rowToRollout);
  }

  async upsert(
    module_key: ModuleKey,
    location_id: string,
    status: RolloutStatus,
    config?: Record<string, unknown>,
    user_id?: string
  ): Promise<ModuleRollout> {
    const now = new Date().toISOString();

    const { data, error } = await (supabase as any)
      .from(TABLE)
      .upsert(
        {
          module_key,
          location_id,
          status,
          config: config ?? null,
          updated_at: now,
        },
        { onConflict: 'module_key,location_id' }
      )
      .select()
      .single();

    if (error) throw new RolloutError(RolloutErrorCode.DATABASE_ERROR, error.message);
    return rowToRollout(data);
  }

  async delete(module_key: ModuleKey, location_id: string): Promise<void> {
    const { error } = await (supabase as any)
      .from(TABLE)
      .delete()
      .eq('module_key', module_key)
      .eq('location_id', location_id);

    if (error) throw new RolloutError(RolloutErrorCode.DATABASE_ERROR, error.message);
  }
}
