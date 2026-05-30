/**
 * QueryBuilder - Construtor de queries genérico
 * 
 * SSOT: Centraliza lógica de construção de queries
 * Elimina duplicação de 150+ queries no projeto
 * 
 * @version 1.0.0
 * @since Sprint 1 - Repository Pattern
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { DatabaseError, DatabaseErrorCode } from '../errors/DatabaseError';
import type { Filter, OrderBy, PaginationOptions, PaginatedResult } from '../interfaces/IRepository';

/**
 * Construtor genérico de queries para Supabase
 * Centraliza toda lógica de query em um único lugar
 */
export class QueryBuilder<T> {
  constructor(private client: SupabaseClient) {}

  /**
   * Busca um registro por ID
   * SSOT: Substitui 40+ ocorrências de .select().eq('id', id).maybeSingle()
   */
  async findById(table: string, id: string): Promise<T | null> {
    try {
      const { data, error } = await this.client
        .from(table)
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        throw DatabaseError.fromSupabaseError(error, 'findById', table);
      }

      return data as T | null;
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

  /**
   * Busca múltiplos registros por IDs
   * SSOT: Substitui 50+ ocorrências de .select().in('id', ids)
   */
  async findByIds(table: string, ids: string[]): Promise<T[]> {
    if (ids.length === 0) return [];

    try {
      const { data, error } = await this.client
        .from(table)
        .select('*')
        .in('id', ids);

      if (error) {
        throw DatabaseError.fromSupabaseError(error, 'findByIds', table);
      }

      return (data as T[]) || [];
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

  /**
   * Conta registros com filtros
   * SSOT: Substitui 30+ ocorrências de .select('id', { count: 'exact', head: true })
   */
  async count(table: string, filters?: Filter[]): Promise<number> {
    try {
      let query = this.client
        .from(table)
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

  /**
   * Busca todos os registros com filtros e ordenação
   */
  async findAll(
    table: string,
    filters?: Filter[],
    orderBy?: OrderBy[]
  ): Promise<T[]> {
    try {
      let query = this.client.from(table).select('*');

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

      return (data as T[]) || [];
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

  /**
   * Busca registros com paginação
   */
  async findPaginated(
    table: string,
    pagination: PaginationOptions,
    filters?: Filter[],
    orderBy?: OrderBy[]
  ): Promise<PaginatedResult<T>> {
    const { page, pageSize } = pagination;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    try {
      // Query para dados
      let dataQuery = this.client.from(table).select('*').range(from, to);

      if (filters) {
        dataQuery = this.applyFilters(dataQuery, filters);
      }

      if (orderBy) {
        dataQuery = this.applyOrderBy(dataQuery, orderBy);
      }

      // Query para contagem total
      const [dataResult, total] = await Promise.all([
        dataQuery,
        this.count(table, filters),
      ]);

      if (dataResult.error) {
        throw DatabaseError.fromSupabaseError(dataResult.error, 'findPaginated', table);
      }

      const data = (dataResult.data as T[]) || [];
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

  /**
   * Cria um registro
   */
  async create(table: string, data: Partial<T>): Promise<T> {
    try {
      const { data: result, error } = await this.client
        .from(table)
        .insert(data)
        .select()
        .single();

      if (error) {
        throw DatabaseError.fromSupabaseError(error, 'create', table);
      }

      return result as T;
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

  /**
   * Cria múltiplos registros
   */
  async createMany(table: string, data: Partial<T>[]): Promise<T[]> {
    if (data.length === 0) return [];

    try {
      const { data: result, error } = await this.client
        .from(table)
        .insert(data)
        .select();

      if (error) {
        throw DatabaseError.fromSupabaseError(error, 'createMany', table);
      }

      return (result as T[]) || [];
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

  /**
   * Atualiza um registro
   */
  async update(table: string, id: string, data: Partial<T>): Promise<T> {
    try {
      const { data: result, error } = await this.client
        .from(table)
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

      return result as T;
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

  /**
   * Deleta um registro
   */
  async delete(table: string, id: string): Promise<void> {
    try {
      const { error } = await this.client
        .from(table)
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

  /**
   * Verifica se registro existe
   */
  async exists(table: string, id: string): Promise<boolean> {
    try {
      const { data, error } = await this.client
        .from(table)
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

  /**
   * Aplica filtros à query
   * SSOT: Lógica centralizada de filtros
   */
  private applyFilters(query: any, filters: Filter[]): any {
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
          result = result.in(filter.field, filter.value);
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

  /**
   * Aplica ordenação à query
   * SSOT: Lógica centralizada de ordenação
   */
  private applyOrderBy(query: any, orderBy: OrderBy[]): any {
    let result = query;

    for (const order of orderBy) {
      result = result.order(order.field, { ascending: order.direction === 'asc' });
    }

    return result;
  }
}
