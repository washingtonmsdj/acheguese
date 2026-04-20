/**
 * Fachada canônica de mobilidade para consumo cross-domain.
 *
 * SSOT v2.0: Exporta funções de queries e mutations diretamente.
 */

// ============================================================
// QUERIES - Operações de Leitura (SSOT)
// ============================================================
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
} from "@/core/mobility/services/mobility.queries";

// ============================================================
// MUTATIONS - Operações de Escrita (SSOT)
// ============================================================
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
} from "@/core/mobility/services/mobility.mutations";

// ============================================================
// SERVICES ESPECIALIZADOS
// ============================================================
export {
  MobilityAdminQueryService,
} from "@/core/mobility/services/MobilityAdminQueryService";

export {
  MobilityRolloutService,
  mobilityRolloutService,
} from "@/core/mobility/services/MobilityRolloutService";

export {
  mobilityAuditService,
} from "@/core/mobility/services/MobilityAuditService";

export {
  DriverModerationEventsService,
} from "@/core/mobility/services/DriverModerationEventsService";
export type {
  DriverModerationAction,
} from "@/core/mobility/services/DriverModerationEventsService";

export {
  RideReportsService,
} from "@/core/mobility/services/RideReportsService";
export type {
  RideReport,
  ReportStatus,
  ReportSeverity,
} from "@/core/mobility/services/RideReportsService";

export {
  RideOperationalService,
} from "@/core/mobility/core/RideOperationalService";
export { RideRatingService } from "@/core/mobility/services/RideRatingService";
export {
  DriverAvailabilityService,
} from "@/core/mobility/services/DriverAvailabilityService";

// ============================================================
// FACADE UNIFICADA (Recomendado)
// ============================================================
export {
  MobilityService,
  MobilityFacade,
  UnifiedMobilityService,
} from "@/core/mobility/services/MobilityService";
export { mobilityService } from "@/core/mobility/services/MobilityService.impl";
