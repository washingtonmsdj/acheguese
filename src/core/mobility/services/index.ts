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
} from "@/modules/mobility/services/mobility.queries";

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
} from "@/modules/mobility/services/mobility.mutations";

// ============================================================
// SERVICES ESPECIALIZADOS
// ============================================================
export {
  MobilityAdminQueryService,
} from "@/modules/mobility/services/MobilityAdminQueryService";

export {
  MobilityRolloutService,
  mobilityRolloutService,
} from "@/modules/mobility/services/MobilityRolloutService";

// ============================================================
// FACADE UNIFICADA (Recomendado)
// ============================================================
export {
  MobilityService,
  MobilityFacade,
  UnifiedMobilityService,
} from "@/modules/mobility/services/MobilityService";
