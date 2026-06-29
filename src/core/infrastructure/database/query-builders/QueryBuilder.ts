/**
 * QueryBuilder - generic Supabase query builder.
 *
 * SSOT: centralizes shared query construction logic.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { DatabaseError, DatabaseErrorCode } from '../errors/DatabaseError';
import type { Filter, OrderBy, PaginationOptions, PaginatedResult } from '../interfaces/IRepository';

type QueryErrorLike = {
  message?: string | null;
  code?: string | null;
} | null;

type QueryPayload<TRow> = {
  data: TRow[] | null;
  error: QueryErrorLike;
  count?: number | null;
};

type SingleQueryPayload<TRow> = {
  data: TRow | null;
  error: QueryErrorLike;
  count?: number | null;
};

type FilterableQuery<TRow> = PromiseLike<QueryPayload<TRow>> & {
  select(columns?: string, options?: { count?: 'exact'; head?: boolean }): FilterableQuery<TRow>;
  eq(column: string, value: unknown): FilterableQuery<TRow>;
  neq(column: string, value: unknown): FilterableQuery<TRow>;
  gt(column: string, value: unknown): FilterableQuery<TRow>;
  gte(column: string, value: unknown): FilterableQuery<TRow>;
  lt(column: string, value: unknown): FilterableQuery<TRow>;
  lte(column: string, value: unknown): FilterableQuery<TRow>;
  in(column: string, values: readonly unknown[]): FilterableQuery<TRow>;
  like(column: string, value: unknown): FilterableQuery<TRow>;
  ilike(column: string, value: unknown): FilterableQuery<TRow>;
  order(column: string, options?: { ascending: boolean }): FilterableQuery<TRow>;
  range(from: number, to: number): FilterableQuery<TRow>;
  insert(values: unknown): FilterableQuery<TRow>;
  update(values: unknown): FilterableQuery<TRow>;
  delete(): FilterableQuery<TRow>;
  maybeSingle(): Promise<SingleQueryPayload<TRow>>;
  single(): Promise<SingleQueryPayload<TRow>>;
};

type QueryBuilderClient = {
  from<TRow = Record<string, unknown>>(table: string): FilterableQuery<TRow>;
};

export class QueryBuilder<T> {
  private readonly clientRef: QueryBuilderClient;

  constructor(client: SupabaseClient) {
    this.clientRef = client as unknown as QueryBuilderClient;
  }

  async findById(table: string, id: string): Promise<T | null> {
    try {
      const { data, error } = await this.clientRef
        .from<T>(table)
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        throw DatabaseError.fromSupabaseError(error, 'findById', table);
      }

      return data;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError({
        code: DatabaseErrorCode.QUERY_ERROR,
        message: `Failed to find record by id in ${table}`,
        originalError: error,
        table,
        operation: 'findById',
      });
    }
  }

  async findByIds(table: string, ids: string[]): Promise<T[]> {
    if (ids.length === 0) return [];

    try {
      const { data, error } = await this.clientRef
        .from<T>(table)
        .select('*')
        .in('id', ids);

      if (error) {
        throw DatabaseError.fromSupabaseError(error, 'findByIds', table);
      }

      return data || [];
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError({
        code: DatabaseErrorCode.QUERY_ERROR,
        message: `Failed to find records by ids in ${table}`,
        originalError: error,
        table,
        operation: 'findByIds',
      });
    }
  }

  async count(table: string, filters?: Filter[]): Promise<number> {
    try {
      let query = this.clientRef
        .from<T>(table)
        .select('id', { count: 'exact', head: true });

      if (filters) {
        query = this.applyFilters(query, filters);
      }

      const { count, error } = await query;

      if (error) {
        throw DatabaseError.fromSupabaseError(error, 'count', table);
      }

      return count || 0;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError({
        code: DatabaseErrorCode.QUERY_ERROR,
        message: `Failed to count records in ${table}`,
        originalError: error,
        table,
        operation: 'count',
      });
    }
  }

  async findAll(table: string, filters?: Filter[], orderBy?: OrderBy[]): Promise<T[]> {
    try {
      let query = this.clientRef.from<T>(table).select('*');

      if (filters) {
        query = this.applyFilters(query, filters);
      }

      if (orderBy) {
        query = this.applyOrderBy(query, orderBy);
      }

      const { data, error } = await query;

      if (error) {
        throw DatabaseError.fromSupabaseError(error, 'findAll', table);
      }

      return data || [];
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError({
        code: DatabaseErrorCode.QUERY_ERROR,
        message: `Failed to find all records in ${table}`,
        originalError: error,
        table,
        operation: 'findAll',
      });
    }
  }

  async findPaginated(
    table: string,
    pagination: PaginationOptions,
    filters?: Filter[],
    orderBy?: OrderBy[],
  ): Promise<PaginatedResult<T>> {
    const { page, pageSize } = pagination;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    try {
      let dataQuery = this.clientRef.from<T>(table).select('*').range(from, to);

      if (filters) {
        dataQuery = this.applyFilters(dataQuery, filters);
      }

      if (orderBy) {
        dataQuery = this.applyOrderBy(dataQuery, orderBy);
      }

      const [dataResult, total] = await Promise.all([
        dataQuery,
        this.count(table, filters),
      ]);

      if (dataResult.error) {
        throw DatabaseError.fromSupabaseError(dataResult.error, 'findPaginated', table);
      }

      const data = dataResult.data || [];
      const totalPages = Math.ceil(total / pageSize);

      return {
        data,
        total,
        page,
        pageSize,
        totalPages,
      };
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError({
        code: DatabaseErrorCode.QUERY_ERROR,
        message: `Failed to find paginated records in ${table}`,
        originalError: error,
        table,
        operation: 'findPaginated',
      });
    }
  }

  async create(table: string, data: Partial<T>): Promise<T> {
    try {
      const { data: result, error } = await this.clientRef
        .from<T>(table)
        .insert(data)
        .select()
        .single();

      if (error) {
        throw DatabaseError.fromSupabaseError(error, 'create', table);
      }

      if (!result) {
        throw new DatabaseError({
          code: DatabaseErrorCode.QUERY_ERROR,
          message: `Create returned no data for ${table}`,
          table,
          operation: 'create',
        });
      }

      return result;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError({
        code: DatabaseErrorCode.QUERY_ERROR,
        message: `Failed to create record in ${table}`,
        originalError: error,
        table,
        operation: 'create',
      });
    }
  }

  async createMany(table: string, data: Partial<T>[]): Promise<T[]> {
    if (data.length === 0) return [];

    try {
      const { data: result, error } = await this.clientRef
        .from<T>(table)
        .insert(data)
        .select();

      if (error) {
        throw DatabaseError.fromSupabaseError(error, 'createMany', table);
      }

      return result || [];
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError({
        code: DatabaseErrorCode.QUERY_ERROR,
        message: `Failed to create multiple records in ${table}`,
        originalError: error,
        table,
        operation: 'createMany',
      });
    }
  }

  async update(table: string, id: string, data: Partial<T>): Promise<T> {
    try {
      const { data: result, error } = await this.clientRef
        .from<T>(table)
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw DatabaseError.fromSupabaseError(error, 'update', table);
      }

      if (!result) {
        throw new DatabaseError({
          code: DatabaseErrorCode.NOT_FOUND,
          message: `Record not found in ${table}`,
          table,
          operation: 'update',
          context: { id },
        });
      }

      return result;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError({
        code: DatabaseErrorCode.QUERY_ERROR,
        message: `Failed to update record in ${table}`,
        originalError: error,
        table,
        operation: 'update',
      });
    }
  }

  async delete(table: string, id: string): Promise<void> {
    try {
      const { error } = await this.clientRef
        .from<T>(table)
        .delete()
        .eq('id', id);

      if (error) {
        throw DatabaseError.fromSupabaseError(error, 'delete', table);
      }
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError({
        code: DatabaseErrorCode.QUERY_ERROR,
        message: `Failed to delete record in ${table}`,
        originalError: error,
        table,
        operation: 'delete',
      });
    }
  }

  async exists(table: string, id: string): Promise<boolean> {
    try {
      const { data, error } = await this.clientRef
        .from<T>(table)
        .select('id')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        throw DatabaseError.fromSupabaseError(error, 'exists', table);
      }

      return data !== null;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError({
        code: DatabaseErrorCode.QUERY_ERROR,
        message: `Failed to check if record exists in ${table}`,
        originalError: error,
        table,
        operation: 'exists',
      });
    }
  }

  private applyFilters(query: FilterableQuery<T>, filters: Filter[]): FilterableQuery<T> {
    let result = query;

    for (const filter of filters) {
      switch (filter.operator) {
        case 'eq':
          result = result.eq(filter.field, filter.value);
          break;
        case 'neq':
          result = result.neq(filter.field, filter.value);
          break;
        case 'gt':
          result = result.gt(filter.field, filter.value);
          break;
        case 'gte':
          result = result.gte(filter.field, filter.value);
          break;
        case 'lt':
          result = result.lt(filter.field, filter.value);
          break;
        case 'lte':
          result = result.lte(filter.field, filter.value);
          break;
        case 'in':
          result = result.in(
            filter.field,
            Array.isArray(filter.value) ? filter.value : [filter.value],
          );
          break;
        case 'like':
          result = result.like(filter.field, filter.value);
          break;
        case 'ilike':
          result = result.ilike(filter.field, filter.value);
          break;
      }
    }

    return result;
  }

  private applyOrderBy(query: FilterableQuery<T>, orderBy: OrderBy[]): FilterableQuery<T> {
    let result = query;

    for (const order of orderBy) {
      result = result.order(order.field, { ascending: order.direction === 'asc' });
    }

    return result;
  }
}
