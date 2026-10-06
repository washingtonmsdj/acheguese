export type { EducationProfileStatus } from "@/core/education/types";
export type {
  EducationAnalyticsData,
  EducationAnalyticsEvent,
  EducationAnalyticsEventType,
  EducationGradeMetrics,
  EducationShiftMetrics,
  EducationEvent,
  EducationLead,
  EducationLeadEvent,
  EducationLeadStatus,
  EducationLevel,
  EducationNicheKey,
  EducationProfile,
  EducationProgram,
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
  getEducationEventValidationError,
} from "@/core/education/eventValidation";
export type { EducationEventValidationInput } from "@/core/education/eventValidation";
