/**
 * IRepository - base repository contract.
 *
 * SSOT for database operations across repositories.
 */

export interface Filter {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'like' | 'ilike';
  value: unknown;
}

export interface PaginationOptions {
  page: number;
  pageSize: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface OrderBy {
  field: string;
  direction: 'asc' | 'desc';
}

export interface IRepository<T> {
  findById(id: string): Promise<T | null>;
  findByIds(ids: string[]): Promise<T[]>;
  findAll(filters?: Filter[], orderBy?: OrderBy[]): Promise<T[]>;
  findPaginated(
    pagination: PaginationOptions,
    filters?: Filter[],
    orderBy?: OrderBy[],
  ): Promise<PaginatedResult<T>>;
  count(filters?: Filter[]): Promise<number>;
  create(data: Partial<T>): Promise<T>;
  createMany(data: Partial<T>[]): Promise<T[]>;
  update(id: string, data: Partial<T>): Promise<T>;
  updateMany(filters: Filter[], data: Partial<T>): Promise<number>;
  delete(id: string): Promise<void>;
  deleteMany(filters: Filter[]): Promise<number>;
  exists(id: string): Promise<boolean>;
}
