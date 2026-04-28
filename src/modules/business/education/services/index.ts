/**
 * Education Module - Services
 *
 * Services para operacoes de negocio do modulo Education.
 */

export { EducationService } from './EducationService';
export { EducationUrlService } from './EducationUrlService';
export { EducationSubscriptionService } from './education-subscription.service';
export { EducationLimitValidationService } from './EducationLimitValidationService';
export { EducationTrackingService } from './EducationTrackingService';
export {
  EducationObservabilityService,
  trackLeadCreated,
  trackLeadConverted,
  trackProfilePublished,
  trackEducationError,
} from './EducationObservabilityService';
export * as educationQueries from './education.queries';
export * as educationMutations from './education.mutations';

