export type { EducationProfileStatus } from "@/core/education/types";
export type {
  EducationAnalyticsData,
  EducationAnalyticsEvent,
  EducationAnalyticsEventType,
  EducationGradeMetrics,
  EducationShiftMetrics,
  EducationEvent,
  EducationEventAdminPatch,
  EducationLead,
  EducationLeadAdminPatch,
  EducationLeadEvent,
  EducationLeadStatus,
  EducationLevel,
  EducationNicheKey,
  EducationProfile,
  EducationProgram,
  EducationProgramAdminPatch,
  EducationPublicProfile,
  EducationPublicRoute,
  SchoolAccessibilityFeatureKey,
  SchoolAgeRange,
  SchoolBasicResourceKey,
  SchoolEquipmentFeatureKey,
  SchoolEventType,
  SchoolFacilityFeatureKey,
  SchoolNetwork,
  SchoolShift,
  SchoolType,
  TrackEventPayload,
} from "@/core/education/contracts";
export {
  EducationObservabilityService,
  trackEducationError,
  trackLeadConverted,
  trackLeadCreated,
  trackProfilePublished,
} from "@/core/education/services/EducationObservabilityService";
export type {
  EducationEventPayload,
  EducationEventType,
} from "@/core/education/services/EducationObservabilityService";
export { EducationTrackingService } from "@/core/education/services/EducationTrackingService";
export type { TrackEventOptions } from "@/core/education/services/EducationTrackingService";

export {
  EDUCATION_EVENT_LOCATION_MAX_LENGTH,
  EDUCATION_EVENT_TITLE_MAX_LENGTH,
  areEducationEventTimesOverlapping,
  getEducationEventValidationError,
} from "@/core/education/eventValidation";
export type {
  EducationEventTimeRange,
  EducationEventValidationInput,
} from "@/core/education/eventValidation";
export {
  EDUCATION_PROGRAM_AGE_GROUP_MAX_LENGTH,
  EDUCATION_PROGRAM_NAME_MAX_LENGTH,
  getEducationProgramNameValidationError,
  getEducationProgramNumericValidationError,
} from "@/core/education/programValidation";

export {
  EDUCATION_PROFILE_MAX_AGE,
  EDUCATION_PROFILE_MIN_AGE,
  getEducationProfileSetupValidationErrors,
  resolveEducationSourceProvenance,
} from "@/core/education/profileValidation";
export type {
  EducationProfileSetupValidationError,
  EducationProfileSetupValidationInput,
  EducationSourceProvenance,
} from "@/core/education/profileValidation";

export {
  EDUCATION_LEAD_PIPELINE,
  canMoveEducationLeadToStatus,
  getEducationLeadNextStatuses,
  EDUCATION_LEAD_LOST_REASON_MAX_LENGTH,
  EDUCATION_LEAD_LOST_REASON_MIN_LENGTH,
  getEducationLeadLostReasonValidationError,
} from "@/core/education/leadPipelineValidation";

export {
  getEducationEventTemporalState,
  isEducationEventActive,
} from "@/core/education/eventTemporalState";
export type {
  EducationEventTemporalInput,
  EducationEventTemporalState,
} from "@/core/education/eventTemporalState";
