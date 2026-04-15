// @ts-nocheck
/**
 * LocationRepositorySupabase
 *
 * Implementação real de ILocationRepository usando Supabase.
 * Substitui LocationRepositoryMock quando VITE_USE_MOCK_DATA=false.
 *
 * Contrato público idêntico ao mock — LocationService não sabe qual está ativo.
 */

import { supabase } from '@/integrations/supabase';
import { LocationErrorCode } from '../types/index';
import { LocationError } from '../errors/LocationError';
import type { ILocationRepository } from './ILocationRepository';
import type { Location, LocationType, LocationStatus } from '../types/index';
import { LOCATION_PAGINATION } from '../types/index';

const TABLE = 'locations';

/** Converte row do banco para o tipo Location do domínio */
function rowToLocation(row: Record<string, unknown>): Location {
  return {
    id: row.id as string,
    parent_id: (row.parent_id as string | null) ?? null,
    type: row.type as LocationType,
    slug: row.slug as string,
    name: row.name as string,
    full_name: row.full_name as string,
    geographic_path: row.geographic_path as string,
    status: row.status as LocationStatus,
    metadata: (row.metadata as Location['metadata']) ?? {},
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

export class LocationRepositorySupabase implements ILocationRepository {
  async findById(id: string): Promise<Location | null> {
    const { data, error } = await (supabase as any)
      .from(TABLE)
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw new LocationError(LocationErrorCode.DATABASE_ERROR, error.message);
    if (!data) return null;
    return rowToLocation(data);
  }

  async findByPath(path: string): Promise<Location | null> {
    const { data, error } = await (supabase as any)
      .from(TABLE)
      .select('*')
      .eq('geographic_path', path)
      .maybeSingle();

    if (error) throw new LocationError(LocationErrorCode.DATABASE_ERROR, error.message);
    if (!data) return null;
    return rowToLocation(data);
  }

  async findBySlugWithinParent(slug: string, parent_id: string): Promise<Location | null> {
    const { data, error } = await (supabase as any)
      .from(TABLE)
      .select('*')
      .eq('slug', slug)
      .eq('parent_id', parent_id)
      .maybeSingle();

    if (error) throw new LocationError(LocationErrorCode.DATABASE_ERROR, error.message);
    if (!data) return null;
    return rowToLocation(data);
  }

  async findAncestors(location_id: string, include_self = false): Promise<Location[]> {
    // Resolve a cadeia de ancestrais iterativamente.
    // Alternativa futura: RPC com recursive CTE para performance.
    const ancestors: Location[] = [];
    let currentId: string | null = location_id;

    if (include_self) {
      const self = await this.findById(location_id);
      if (self) ancestors.push(self);
      currentId = self?.parent_id ?? null;
    }

    while (currentId) {
      const parent = await this.findById(currentId);
      if (!parent) break;
      ancestors.push(parent);
      currentId = parent.parent_id;
    }

    return ancestors;
  }

  async findDescendants(
    location_id: string,
    options: {
      include_self?: boolean;
      max_depth?: number;
      page?: number;
      page_size?: number;
    }
  ): Promise<{ locations: Location[]; total_count: number }> {
    const page = options.page ?? LOCATION_PAGINATION.DEFAULT_PAGE;
    const page_size = options.page_size ?? LOCATION_PAGINATION.DEFAULT_PAGE_SIZE;
    const offset = (page - 1) * page_size;

    // Busca todos os descendentes via path prefix — eficiente com índice em geographic_path
    const self = await this.findById(location_id);
    if (!self) return { locations: [], total_count: 0 };

    const pathPrefix = self.geographic_path + '/';

    let query = (supabase as any)
      .from(TABLE)
      .select('*', { count: 'exact' })
      .like('geographic_path', `${pathPrefix}%`)
      .order('geographic_path', { ascending: true })
      .range(offset, offset + page_size - 1);

    if (options.include_self) {
      // Inclui o próprio nó: path = pathPrefix sem trailing slash OU começa com pathPrefix
      query = (supabase as any)
        .from(TABLE)
        .select('*', { count: 'exact' })
        .or(`geographic_path.eq.${self.geographic_path},geographic_path.like.${pathPrefix}%`)
        .order('geographic_path', { ascending: true })
        .range(offset, offset + page_size - 1);
    }

    const { data, error, count } = await query;
    if (error) throw new LocationError(LocationErrorCode.DATABASE_ERROR, error.message);

    return {
      locations: (data ?? []).map(rowToLocation),
      total_count: count ?? 0,
    };
  }

  async findChildren(
    location_id: string,
    options: {
      type?: LocationType;
      status?: LocationStatus;
      page?: number;
      page_size?: number;
    }
  ): Promise<{ locations: Location[]; total_count: number }> {
    // ✅ SSOT - Validação: location_id deve ser UUID válido
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(location_id)) {
      console.warn(`⚠️ LocationRepository.findChildren: Invalid UUID format for location_id: ${location_id}`);
      return { locations: [], total_count: 0 };
    }

    const page = options.page ?? LOCATION_PAGINATION.DEFAULT_PAGE;
    const page_size = options.page_size ?? LOCATION_PAGINATION.DEFAULT_PAGE_SIZE;
    const offset = (page - 1) * page_size;

    let query = (supabase as any)
      .from(TABLE)
      .select('*', { count: 'exact' })
      .eq('parent_id', location_id)
      .order('name', { ascending: true })
      .range(offset, offset + page_size - 1);

    if (options.type) {
      query = query.eq('type', options.type);
    }

    if (options.status) {
      query = query.eq('status', options.status);
    }

    const { data, error, count } = await query;
    if (error) throw new LocationError(LocationErrorCode.DATABASE_ERROR, error.message);

    return {
      locations: (data ?? []).map(rowToLocation),
      total_count: count ?? 0,
    };
  }

  async findAll(): Promise<Location[]> {
    const { data, error } = await (supabase as any)
      .from(TABLE)
      .select('*')
      .order('geographic_path', { ascending: true });

    if (error) throw new LocationError(LocationErrorCode.DATABASE_ERROR, error.message);
    return (data ?? []).map(rowToLocation);
  }
}
