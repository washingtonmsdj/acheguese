/**
 * Professional Core Services
 * Migrated from /src/services/professional/
 */

export { ProfessionalService } from "./services/ProfessionalService";
export type * from "./types";

// Migration (ETAPA 7)
export {
  migrateProfessionalDataToCanonical,
  formatMigrationReport,
  type MigrationResult,
} from './migrations/migrateProfessionalDataToCanonical';

// Canonical Adapter (ETAPA 7)
export {
  isProfessionalMigrated,
  hasPhysicalAddress,
  getFormattedProfessionalAddress,
  getProfessionalCoordinates,
  getProfessionalTerritory,
  getProfessionalTerritoryName,
  type ProfessionalDataWithRelations,
} from './services/ProfessionalCanonicalAdapter';
