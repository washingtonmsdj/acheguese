export type { EducationProfileStatus } from "@/core/education/types";
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
