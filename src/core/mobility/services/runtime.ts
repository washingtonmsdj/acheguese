/**
 * Canonical cross-domain entrypoint for mobility runtime services.
 */
export { mobilityService, MobilityService } from '@/core/mobility/services/MobilityService.impl';
export { DriverAvailabilityService } from '@/core/mobility/services/DriverAvailabilityService';
export {
  MobilityRolloutService,
  mobilityRolloutService,
} from '@/core/mobility/services/MobilityRolloutService';
export {
  DriverModerationEventsService,
} from '@/core/mobility/services/DriverModerationEventsService';
export type {
  DriverModerationAction,
  DriverModerationEvent,
} from '@/core/mobility/services/DriverModerationEventsService';
export { RideReportsService } from '@/core/mobility/services/RideReportsService';
export type {
  RideReport,
  ReportStatus,
  ReportSeverity,
  ReportType,
  ReporterType,
  UpdateReportInput,
} from '@/core/mobility/services/RideReportsService';
export type { RideRequest } from '@/core/mobility/types/types';
