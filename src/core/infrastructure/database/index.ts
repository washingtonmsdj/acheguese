/**
 * Database Infrastructure - Barrel de Exports
 * 
 * SSOT: Ponto único de acesso à camada de infraestrutura de banco
 * 
 * @version 1.0.0
 * @since Sprint 1 - Repository Pattern
 */

// Interfaces
export type {
  IRepository,
  Filter,
  OrderBy,
  PaginationOptions,
  PaginatedResult,
} from './interfaces/IRepository';

// Errors
export {
  DatabaseError,
  DatabaseErrorCode,
  type DatabaseErrorDetails,
} from './errors/DatabaseError';

// Query Builders
export { QueryBuilder } from './query-builders/QueryBuilder';

// Base Repository
export { BaseRepository } from './repositories/BaseRepository';

// Repositories Concretos
export { ProfileRepository, type Profile } from './repositories/ProfileRepository';
