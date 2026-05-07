/**
 * 🏆 PROFESSIONAL SERVICES - SSOT v2.0 Exports
 *
 * @version 2.0.0 - Refatoração SSOT
 */

// ============================================================
// 🎯 QUERIES - Operações de leitura
// ============================================================
export {
  // Professional queries
  getProfessionals,
  getProfessionalsList,
  getProfessionalById,
  getServicesByProfile,
  // Stats queries
  getStats,
  getTotalProfessionalsCount,
  getProfessionalsCreatedInPeriod,
  // Reviews queries
  getReviews,
  getMyReview,
  // Jobs queries
  getJobs,
  // Search queries
  getProfessionalsByIds,
  searchProfessionals,
  getPublicProfileBySlug,
} from "./professional.queries";

// ============================================================
// 📝 MUTATIONS - Operações de escrita
// ============================================================
export {
  // CRUD mutations
  createProfessional,
  updateProfessional,
  deleteProfessional,
  // Jobs mutations
  createJob,
  // Admin mutations
  updateProfessionalStatus,
  deleteProfessionalReview,
  updateProfessionalReport,
  // Types
  type Professional,
  type CreateProfessionalInput,
  type UpdateProfessionalInput,
} from "./professional.mutations";

// ============================================================
// 🏛️ FACADE - Interface unificada (SSOT v2.0)
// ============================================================
export { ProfessionalService, ProfessionalFacade } from "./ProfessionalService";
export { ProfessionalLeadService, type ServiceResult } from "./ProfessionalLeadService";

// ============================================================
// 🔧 LEGACY COMPATIBILITY
// ============================================================
export { professionalService } from "./ProfessionalService";
