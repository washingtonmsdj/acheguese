export type {
  EducationAnalyticsEventType,
  EducationNicheKey,
  EducationProfileStatus,
} from "@/core/education/types";
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
  EducationMetrics,
} from "@/core/education/services/EducationObservabilityService";
export { EducationTrackingService } from "@/core/education/services/EducationTrackingService";
export type { TrackEventOptions } from "@/core/education/services/EducationTrackingService";
