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
  getMobilityConversations,  getRideWithAddresses,
  getDriverData,
  getDriverStatsDetailed,
  getDriverDataIdByProfileId,
  getDriverDataByProfileIds,
  getMobilityStats,
} from "@/core/mobility/services/mobility.queries";

//  ============================================================
//  MUTATIONS - Operaes de Escrita (SSOT)
//  ============================================================
export {
  updateDriverData,
  updateDriverOnlineStatus,
} from "@/core/mobility/services/mobility.mutations";

//  ============================================================
//  SERVICES ESPECIALIZADOS
//  ============================================================
export { MobilityAdminQueryService } from "@/core/mobility/services/MobilityAdminQueryService";

export {
  MobilityRolloutService,
  mobilityRolloutService,
} from "@/core/mobility/services/MobilityRolloutService";

export { DriverModerationEventsService } from "@/core/mobility/services/DriverModerationEventsService";
export type { DriverModerationAction } from "@/core/mobility/services/DriverModerationEventsService";

export { RideReportsService } from "@/core/mobility/services/RideReportsService";
export type {
  RideReport,
  ReportStatus,
  ReportSeverity,
} from "@/core/mobility/services/RideReportsService";

export { RideOperationalService } from "@/core/mobility/core/RideOperationalService";
export { RideRatingService } from "@/core/mobility/services/RideRatingService";
export { MobilityTrustService } from "@/core/mobility/services/MobilityTrustService";
export { RidePassengerService } from "@/core/mobility/services/RidePassengerService";
export { DriverAvailabilityService } from "@/core/mobility/services/DriverAvailabilityService";
export { BoardingPointService } from "@/core/mobility/services/BoardingPointService";
export type {
  BoardingPointSummary,
  BoardingPointSuggestionInput,
} from "@/core/mobility/services/BoardingPointService";
export { DriverPresenceService } from "@/core/mobility/services/DriverPresenceService";
export type { DriverPresenceStats } from "@/core/mobility/services/DriverPresenceService";

//  ============================================================
//  FACADE UNIFICADA (Recomendado)
//  ============================================================
export {
  MobilityService,
  MobilityFacade,
} from "@/core/mobility/services/MobilityService";
export { mobilityService } from "@/core/mobility/services/MobilityService.impl";
