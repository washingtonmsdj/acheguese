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

// Constants
export {
  DATABASE_DRIVER_STATUS,
  DATABASE_PROFILE_VERIFICATION_STATUS,
  type DatabaseDriverStatus,
  type DatabaseProfileVerificationStatus,
} from './constants/statuses';

// Base Repository
export { BaseRepository } from './repositories/BaseRepository';

// Repositories Concretos
export { ProfileRepository, type Profile } from './repositories/ProfileRepository';
export { DriverRepository, type Driver } from './repositories/DriverRepository';
export { BusinessRepository, type Business, type BusinessStatus, type BusinessCategory } from './repositories/BusinessRepository';
export { ClassifiedRepository, type Classified, type ClassifiedStatus, type ClassifiedCondition, type ClassifiedReach } from './repositories/ClassifiedRepository';
