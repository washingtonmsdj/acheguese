/**
 * Professional services - exports canonicos SSOT.
 */

export {
  getProfessionals,
  getProfessionalsList,
  getProfessionalById,
  getServicesByProfile,
  getStats,
  getTotalProfessionalsCount,
  getProfessionalsCreatedInPeriod,
  getReviews,
  getMyReview,
  getJobs,
  getProfessionalsByIds,
  searchProfessionals,
  getPublicProfileBySlug,
} from "./professional.queries";

export {
  createProfessional,
  updateProfessional,
  deleteProfessional,
  createJob,
  updateProfessionalStatus,
  deleteProfessionalReview,
  updateProfessionalReport,
  type Professional,
  type CreateProfessionalInput,
  type UpdateProfessionalInput,
} from "./professional.mutations";

export { ProfessionalService, ProfessionalFacade } from "./ProfessionalService";
export { ProfessionalLeadService, type ServiceResult } from "./ProfessionalLeadService";
