/**
 * BaseRepository - shared implementation for repositories.
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

type EntityWithId = {
  id: string;
};

function hasEntityId(value: unknown): value is EntityWithId {
  return (
    Boolean(value) &&
    typeof value === 'object' &&
    'id' in value &&
    typeof (value as { id?: unknown }).id === 'string'
  );
}

export abstract class BaseRepository<T> implements IRepository<T> {
  protected abstract readonly table: string;
  protected readonly qb: QueryBuilder<T>;
  protected readonly client: SupabaseClient;

  constructor(client: SupabaseClient) {
    this.client = client;
    this.qb = new QueryBuilder<T>(client);
  }

  async findById(id: string): Promise<T | null> {
    return this.qb.findById(this.table, id);
  }

  async findByIds(ids: string[]): Promise<T[]> {
    return this.qb.findByIds(this.table, ids);
  }

  async findAll(filters?: Filter[], orderBy?: OrderBy[]): Promise<T[]> {
    return this.qb.findAll(this.table, filters, orderBy);
  }

  async findPaginated(
    pagination: PaginationOptions,
    filters?: Filter[],
    orderBy?: OrderBy[],
  ): Promise<PaginatedResult<T>> {
    return this.qb.findPaginated(this.table, pagination, filters, orderBy);
  }

  async count(filters?: Filter[]): Promise<number> {
    return this.qb.count(this.table, filters);
  }

  async create(data: Partial<T>): Promise<T> {
    return this.qb.create(this.table, data);
  }

  async createMany(data: Partial<T>[]): Promise<T[]> {
    return this.qb.createMany(this.table, data);
  }

  async update(id: string, data: Partial<T>): Promise<T> {
    return this.qb.update(this.table, id, data);
  }

  async updateMany(filters: Filter[], data: Partial<T>): Promise<number> {
    const records = await this.findAll(filters);

    await Promise.all(
      records.map((record) => {
        if (!hasEntityId(record)) {
          throw new Error(`Repository record from ${this.table} is missing a string id`);
        }

        return this.update(record.id, data);
      }),
    );

    return records.length;
  }

  async delete(id: string): Promise<void> {
    return this.qb.delete(this.table, id);
  }

  async deleteMany(filters: Filter[]): Promise<number> {
    const records = await this.findAll(filters);

    await Promise.all(
      records.map((record) => {
        if (!hasEntityId(record)) {
          throw new Error(`Repository record from ${this.table} is missing a string id`);
        }

        return this.delete(record.id);
      }),
    );

    return records.length;
  }

  async exists(id: string): Promise<boolean> {
    return this.qb.exists(this.table, id);
  }

  protected createFilter(
    field: string,
    operator: Filter['operator'],
    value: unknown,
  ): Filter {
    return { field, operator, value };
  }

  protected createOrderBy(
    field: string,
    direction: 'asc' | 'desc' = 'asc',
  ): OrderBy {
    return { field, direction };
  }
}
