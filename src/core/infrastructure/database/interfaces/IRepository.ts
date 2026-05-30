/**
 * IRepository - Interface Base para Repositories
 * 
 * SSOT: Single Source of Truth para operações de banco de dados
 * Todos os repositories devem implementar esta interface
 * 
 * @version 1.0.0
 * @since Sprint 1 - Repository Pattern
 */

/**
 * Filtro genérico para queries
 */
export interface Filter {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'like' | 'ilike';
  value: any;
}

/**
 * Opções de paginação
 */
export interface PaginationOptions {
  page: number;
  pageSize: number;
}

/**
 * Resultado paginado
 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Opções de ordenação
 */
export interface OrderBy {
  field: string;
  direction: 'asc' | 'desc';
}

/**
 * Interface base para todos os repositories
 * Define o contrato SSOT para operações de banco de dados
 */
export interface IRepository<T> {
  /**
   * Busca um registro por ID
   * @param id - ID do registro
   * @returns Registro encontrado ou null
   */
  findById(id: string): Promise<T | null>;

  /**
   * Busca múltiplos registros por IDs
   * @param ids - Array de IDs
   * @returns Array de registros encontrados
   */
  findByIds(ids: string[]): Promise<T[]>;

  /**
   * Busca todos os registros com filtros opcionais
   * @param filters - Filtros a aplicar
   * @param orderBy - Ordenação
   * @returns Array de registros
   */
  findAll(filters?: Filter[], orderBy?: OrderBy[]): Promise<T[]>;

  /**
   * Busca registros com paginação
   * @param pagination - Opções de paginação
   * @param filters - Filtros a aplicar
   * @param orderBy - Ordenação
   * @returns Resultado paginado
   */
  findPaginated(
    pagination: PaginationOptions,
    filters?: Filter[],
    orderBy?: OrderBy[]
  ): Promise<PaginatedResult<T>>;

  /**
   * Conta registros com filtros opcionais
   * @param filters - Filtros a aplicar
   * @returns Número de registros
   */
  count(filters?: Filter[]): Promise<number>;

  /**
   * Cria um novo registro
   * @param data - Dados do registro
   * @returns Registro criado
   */
  create(data: Partial<T>): Promise<T>;

  /**
   * Cria múltiplos registros
   * @param data - Array de dados
   * @returns Array de registros criados
   */
  createMany(data: Partial<T>[]): Promise<T[]>;

  /**
   * Atualiza um registro
   * @param id - ID do registro
   * @param data - Dados a atualizar
   * @returns Registro atualizado
   */
  update(id: string, data: Partial<T>): Promise<T>;

  /**
   * Atualiza múltiplos registros
   * @param filters - Filtros para selecionar registros
   * @param data - Dados a atualizar
   * @returns Número de registros atualizados
   */
  updateMany(filters: Filter[], data: Partial<T>): Promise<number>;

  /**
   * Deleta um registro (soft delete se suportado)
   * @param id - ID do registro
   */
  delete(id: string): Promise<void>;

  /**
   * Deleta múltiplos registros
   * @param filters - Filtros para selecionar registros
   * @returns Número de registros deletados
   */
  deleteMany(filters: Filter[]): Promise<number>;

  /**
   * Verifica se um registro existe
   * @param id - ID do registro
   * @returns true se existe, false caso contrário
   */
  exists(id: string): Promise<boolean>;
}
