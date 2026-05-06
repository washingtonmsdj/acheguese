/**
 * Core Business Barrel Export
 */

// Re-export de services
export { BusinessService } from './services/BusinessService';
export { BusinessUrlService } from './services/BusinessUrlService';
export { BusinessOwnershipService } from './services/BusinessOwnershipService';
export { BusinessHoursService } from './BusinessHoursService';
export type { BusinessUrlContext, ResolvedBusinessUrl } from './services/BusinessUrlService';
export type {
  BusinessHours,
  BusinessHoursException,
  BusinessOperationConfig,
  BusinessStatus,
} from './BusinessHoursService';
export { DAY_NAMES } from './BusinessHoursService';
export type * from './types';

// Gastronomy queries
export { hasGastronomyProfile } from './services/gastronomy.queries';

// Utils
export * from './utils';

// Validators
export * from './services/validators';

// Migration (ETAPA 6)
export {
  migrateBusinessDataToCanonical,
  formatMigrationReport,
  type MigrationResult,
} from './migrations/migrateBusinessDataToCanonical';

// Canonical Adapter (ETAPA 6)
export {
  isBusinessMigrated,
  hasPhysicalAddress,
  getFormattedBusinessAddress,
  getBusinessCoordinates,
  getBusinessTerritory,
  getBusinessTerritoryName,
  type BusinessWithCanonicalRelations as BusinessDataWithRelations,
} from './services/BusinessCanonicalAdapter';

export { default as NetworkTab } from './components/NetworkTab';
export { useBusinessNavigation } from './hooks/useBusinessNavigation';