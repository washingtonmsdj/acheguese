/**
 * Professional services - exports canonicos SSOT.
 */

export {
  getProfessionals,
  getProfessionalsList,
  getProfessionalById,
  getProfessionalDataIdByProfileId,
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
  createJob,
  updateProfessionalStatus,
  deleteProfessionalReview,
  type Professional,
  type CreateProfessionalInput,
  type UpdateProfessionalInput,
} from "./professional.mutations";

export {
  createProfessionalWithProfile as createProfessional,
  updateProfessionalWithProfile as updateProfessional,
  deleteProfessionalWithProfile as deleteProfessional,
} from "./professional.profile-lifecycle";

export { ProfessionalService, ProfessionalFacade } from "./ProfessionalService";
export { ProfessionalLeadService, type ServiceResult } from "./ProfessionalLeadService";
export {
  ProfessionalLeadIntakeService,
  type CreateProfessionalLeadSubmission,
  type ProfessionalLeadIntakeResult,
  type ProfessionalLeadSourceChannel,
} from "./ProfessionalLeadIntakeService";
export { ProfessionalLinkEligibilityService } from "./ProfessionalLinkEligibilityService";
