export {
  residenceService,
  type UserResidence,
  type UserResidenceWithRelations,
  type CreateResidenceData,
  type UpdateResidenceData,
} from "./services/ResidenceService";
export * from "./hooks/useResidence";

// Components
export { ResidenceManager } from "./components/ResidenceManager";

// Migration
export { 
  migrateUserResidencesToCanonical, 
  formatMigrationReport,
  type MigrationResult 
} from "./migrations/migrateUserResidencesToCanonical";
