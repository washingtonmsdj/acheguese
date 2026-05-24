/**
 *  Fachada cannica de mobilidade para consumo cross-domain.
 *
 *  SSOT: Exporta funes de queries e mutations diretamente.
 */

//  ============================================================
//  QUERIES - Operaes de Leitura (SSOT)
//  ============================================================
export {
  getRideById,
  getActiveRide,
  getUserRides,
  getRidesByDriverProfile,
  getDriverCompleteProfile,
  getPassengerRating,
  getMobilityConversations,
  getLastMessage,
  getUnreadCount,
  getRideWithAddresses,
  getAvailableRides,
  getDriverData,
  getDriverStatsDetailed,
  getDriverDataByProfileIds,
  getMobilityStats,
} from "@/modules/mobility/services/mobility.queries";

//  ============================================================
//  MUTATIONS - Operaes de Escrita (SSOT)
//  ============================================================
export {
  createRide,
  updateRide,
  acceptRide,
  startRide,
  completeRide,
  cancelRide,
  updateDriverData,
  updateDriverOnlineStatus,
  deleteDriverNeighborhood,
  deleteDriverServiceArea,
} from "@/modules/mobility/services/mobility.mutations";

//  ============================================================
//  SERVICES ESPECIALIZADOS
//  ============================================================
export {
  MobilityAdminQueryService,
} from "@/modules/mobility/services/MobilityAdminQueryService";

export {
  MobilityRolloutService,
  mobilityRolloutService,
} from "@/modules/mobility/services/MobilityRolloutService";

export {
  mobilityAuditService,
} from "@/modules/mobility/services/MobilityAuditService";

export {
  DriverModerationEventsService,
} from "@/modules/mobility/services/DriverModerationEventsService";
export type {
  DriverModerationAction,
} from "@/modules/mobility/services/DriverModerationEventsService";

export {
  RideReportsService,
} from "@/modules/mobility/services/RideReportsService";
export type {
  RideReport,
  ReportStatus,
  ReportSeverity,
} from "@/modules/mobility/services/RideReportsService";

export {
  RideOperationalService,
} from "@/modules/mobility/core/RideOperationalService";
export { RideRatingService } from "@/modules/mobility/services/RideRatingService";
export { RidePassengerService } from "@/modules/mobility/services/RidePassengerService";
export {
  DriverAvailabilityService,
} from "@/modules/mobility/services/DriverAvailabilityService";
export {
  BoardingPointService,
} from "@/modules/mobility/services/BoardingPointService";
export type {
  BoardingPointSummary,
  BoardingPointSuggestionInput,
} from "@/modules/mobility/services/BoardingPointService";
export {
  DriverPresenceService,
} from "@/modules/mobility/services/DriverPresenceService";
export type {
  DriverPresenceStats,
} from "@/modules/mobility/services/DriverPresenceService";

//  ============================================================
//  FACADE UNIFICADA (Recomendado)
//  ============================================================
export {
  MobilityService,
  MobilityFacade,
  UnifiedMobilityService,
} from "@/modules/mobility/services/MobilityService";
export { mobilityService } from "@/modules/mobility/services/MobilityService.impl";
