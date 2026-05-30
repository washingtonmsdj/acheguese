/**
 * BaseRepository - Implementação base para todos os repositories
 * 
 * SSOT: Implementação única que todos os repositories herdam
 * Elimina duplicação de código em 200+ arquivos
 * 
 * @version 1.0.0
 * @since Sprint 1 - Repository Pattern
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { QueryBuilder } from '../query-builders/QueryBuilder';
import type {
  IRepository,
  Filter,
  OrderBy,
  PaginationOptions,
  PaginatedResult,
} from '../interfaces/IRepository';

/**
 * Classe base abstrata para todos os repositories
 * Fornece implementação padrão de todas as operações CRUD
 * 
 * Repositories específicos devem:
 * 1. Estender esta classe
 * 2. Definir a propriedade 'table'
 * 3. Adicionar métodos específicos do domínio
 */
export abstract class BaseRepository<T> implements IRepository<T> {
  /**
   * Nome da tabela no banco de dados
   * Deve ser definido por cada repository concreto
   */
  protected abstract readonly table: string;

  /**
   * Query builder para operações genéricas
   */
  protected readonly qb: QueryBuilder<T>;

  /**
   * Cliente Supabase (isolado aqui, não exposto)
   */
  protected readonly client: SupabaseClient;

  constructor(client: SupabaseClient) {
    this.client = client;
    this.qb = new QueryBuilder<T>(client);
  }

  /**
   * Busca um registro por ID
   * Implementação padrão usando QueryBuilder
   */
  async findById(id: string): Promise<T | null> {
    return this.qb.findById(this.table, id);
  }

  /**
   * Busca múltiplos registros por IDs
   * Implementação padrão usando QueryBuilder
   */
  async findByIds(ids: string[]): Promise<T[]> {
    return this.qb.findByIds(this.table, ids);
  }

  /**
   * Busca todos os registros com filtros opcionais
   * Implementação padrão usando QueryBuilder
   */
  async findAll(filters?: Filter[], orderBy?: OrderBy[]): Promise<T[]> {
    return this.qb.findAll(this.table, filters, orderBy);
  }

  /**
   * Busca registros com paginação
   * Implementação padrão usando QueryBuilder
   */
  async findPaginated(
    pagination: PaginationOptions,
    filters?: Filter[],
    orderBy?: OrderBy[]
  ): Promise<PaginatedResult<T>> {
    return this.qb.findPaginated(this.table, pagination, filters, orderBy);
  }

  /**
   * Conta registros com filtros opcionais
   * Implementação padrão usando QueryBuilder
   */
  async count(filters?: Filter[]): Promise<number> {
    return this.qb.count(this.table, filters);
  }

  /**
   * Cria um novo registro
   * Implementação padrão usando QueryBuilder
   */
  async create(data: Partial<T>): Promise<T> {
    return this.qb.create(this.table, data);
  }

  /**
   * Cria múltiplos registros
   * Implementação padrão usando QueryBuilder
   */
  async createMany(data: Partial<T>[]): Promise<T[]> {
    return this.qb.createMany(this.table, data);
  }

  /**
   * Atualiza um registro
   * Implementação padrão usando QueryBuilder
   */
  async update(id: string, data: Partial<T>): Promise<T> {
    return this.qb.update(this.table, id, data);
  }

  /**
   * Atualiza múltiplos registros
   * Implementação padrão - pode ser sobrescrita
   */
  async updateMany(filters: Filter[], data: Partial<T>): Promise<number> {
    // Implementação básica - pode ser otimizada por repositories específicos
    const records = await this.findAll(filters);
    
    await Promise.all(
      records.map((record: any) => this.update(record.id, data))
    );

    return records.length;
  }

  /**
   * Deleta um registro
   * Implementação padrão usando QueryBuilder
   */
  async delete(id: string): Promise<void> {
    return this.qb.delete(this.table, id);
  }

  /**
   * Deleta múltiplos registros
   * Implementação padrão - pode ser sobrescrita
   */
  async deleteMany(filters: Filter[]): Promise<number> {
    // Implementação básica - pode ser otimizada por repositories específicos
    const records = await this.findAll(filters);
    
    await Promise.all(
      records.map((record: any) => this.delete(record.id))
    );

    return records.length;
  }

  /**
   * Verifica se um registro existe
   * Implementação padrão usando QueryBuilder
   */
  async exists(id: string): Promise<boolean> {
    return this.qb.exists(this.table, id);
  }

  /**
   * Método auxiliar para criar filtros
   * Facilita criação de filtros tipados
   */
  protected createFilter(
    field: string,
    operator: Filter['operator'],
    value: any
  ): Filter {
    return { field, operator, value };
  }

  /**
   * Método auxiliar para criar ordenação
   * Facilita criação de ordenação tipada
   */
  protected createOrderBy(
    field: string,
    direction: 'asc' | 'desc' = 'asc'
  ): OrderBy {
    return { field, direction };
  }
}
