/**
 * CoverageRepositorySupabase
 *
 * Implementação real de ICoverageRepository usando Supabase.
 *
 * STATUS: implementado, NÃO validado em runtime — banco desligado.
 * Validar quando VITE_USE_MOCK_DATA=false e tabela service_areas existir.
 *
 * Migration necessária: src/core/coverage/sql/001_coverage_table.sql (a criar)
 */

import { supabase } from '@/integrations/supabase';
import { CoverageErrorCode } from '../types/index';
import { CoverageError } from '../errors/CoverageError';
import type { ICoverageRepository } from './ICoverageRepository';
import type { ServiceArea, EntityType, CoverageStatus } from '../types/index';
import { COVERAGE_PAGINATION } from '../types/index';

const TABLE = 'service_areas';

function rowToServiceArea(row: Record<string, unknown>): ServiceArea {
  return {
    id: row.id as string,
    entity_type: row.entity_type as EntityType,
    entity_id: row.entity_id as string,
    coverage_type: row.coverage_type as ServiceArea['coverage_type'],
    location_id: row.location_id as string,
    radius_km: (row.radius_km as number | null) ?? null,
    is_primary: row.is_primary as boolean,
    status: row.status as CoverageStatus,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

export class CoverageRepositorySupabase implements ICoverageRepository {
  async createMany(
    coverages: Omit<ServiceArea, 'id' | 'created_at' | 'updated_at'>[]
  ): Promise<ServiceArea[]> {
    const { data, error } = await (supabase as any)
      .from(TABLE)
      .insert(coverages)
      .select();

    if (error) throw new CoverageError(CoverageErrorCode.DATABASE_ERROR, error.message);
    return (data ?? []).map(rowToServiceArea);
  }

  async findByEntity(
    entity_type: EntityType,
    entity_id: string,
    status?: CoverageStatus
  ): Promise<ServiceArea[]> {
    let query = (supabase as any)
      .from(TABLE)
      .select('*')
      .eq('entity_type', entity_type)
      .eq('entity_id', entity_id)
      .order('is_primary', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw new CoverageError(CoverageErrorCode.DATABASE_ERROR, error.message);
    return (data ?? []).map(rowToServiceArea);
  }

  async findPrimaryByEntity(
    entity_type: EntityType,
    entity_id: string
  ): Promise<ServiceArea | null> {
    const { data, error } = await (supabase as any)
      .from(TABLE)
      .select('*')
      .eq('entity_type', entity_type)
      .eq('entity_id', entity_id)
      .eq('is_primary', true)
      .maybeSingle();

    if (error) throw new CoverageError(CoverageErrorCode.DATABASE_ERROR, error.message);
    if (!data) return null;
    return rowToServiceArea(data);
  }

  async findEntitiesCovering(
    entity_type: EntityType,
    location_id: string,
    options: { status?: CoverageStatus; page?: number; page_size?: number }
  ): Promise<{ entity_ids: string[]; total_count: number }> {
    const page = options.page ?? COVERAGE_PAGINATION.DEFAULT_PAGE;
    const page_size = options.page_size ?? COVERAGE_PAGINATION.DEFAULT_PAGE_SIZE;
    const offset = (page - 1) * page_size;

    let query = (supabase as any)
      .from(TABLE)
      .select('entity_id', { count: 'exact' })
      .eq('entity_type', entity_type)
      .eq('location_id', location_id)
      .range(offset, offset + page_size - 1);

    if (options.status) {
      query = query.eq('status', options.status);
    }

    const { data, error, count } = await query;
    if (error) throw new CoverageError(CoverageErrorCode.DATABASE_ERROR, error.message);

    const entity_ids = [...new Set((data ?? []).map((r: Record<string, unknown>) => r.entity_id as string))] as string[];
    return { entity_ids, total_count: count ?? 0 };
  }

  async deleteByEntity(
    entity_type: EntityType,
    entity_id: string,
    coverage_id?: string
  ): Promise<number> {
    let query = (supabase as any)
      .from(TABLE)
      .delete()
      .eq('entity_type', entity_type)
      .eq('entity_id', entity_id);

    if (coverage_id) {
      query = query.eq('id', coverage_id);
    }

    const { error, count } = await query;
    if (error) throw new CoverageError(CoverageErrorCode.DATABASE_ERROR, error.message);
    return count ?? 0;
  }

  async updateStatus(coverage_id: string, status: CoverageStatus): Promise<void> {
    const { error } = await (supabase as any)
      .from(TABLE)
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', coverage_id);

    if (error) throw new CoverageError(CoverageErrorCode.DATABASE_ERROR, error.message);
  }

  async findById(coverage_id: string): Promise<ServiceArea | null> {
    const { data, error } = await (supabase as any)
      .from(TABLE)
      .select('*')
      .eq('id', coverage_id)
      .maybeSingle();

    if (error) throw new CoverageError(CoverageErrorCode.DATABASE_ERROR, error.message);
    if (!data) return null;
    return rowToServiceArea(data);
  }
}
