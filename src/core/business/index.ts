/**
 * Core Business Barrel Export
 * 
 * Re-exporta funcionalidades do módulo business que são usadas por outras camadas core.
 * Isso mantém o isolamento de módulos enquanto permite que core acesse funcionalidades compartilhadas.
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

// Utils
export * from './utils';

// Validators
export * from './services/validators';

// Re-export seletivo do módulo business para evitar conflitos
export { 
  BusinessCard,
  BusinessGrid,
  BusinessHeader,
  BusinessAbout,
  BusinessGallery,
  BusinessProducts,
  BusinessReviews,
  BusinessService as BusinessModuleService,
} from '@/modules/business';

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

export { default as NetworkTab } from "@/modules/business/components/NetworkTab";
export { useBusinessNavigation } from "@/modules/business/hooks/useBusinessNavigation";
