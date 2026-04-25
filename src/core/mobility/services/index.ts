/**
 * 🛵 MOBILITY SERVICES - Core SSOT v3.0 Exports
 *
 * Centraliza todas as operações de dados de mobilidade
 * - Queries: Leitura de dados
 * - Mutations: Escrita de dados
 * - Constants: Constantes compartilhadas
 *
 * @version 3.0.0 - Core SSOT (movido de modules/mobility)
 */

// ============================================================
// 🎯 QUERIES - Operações de leitura
// ============================================================
export {
  // Rides
  getActiveRides,
  getRideById,
  getAllRideRequests,
  getRidesByPassenger,
  getRidesByDriverProfile,
  getActiveRideByDriverProfile,
  getActiveRide,
  getRideDispatchData,
  getRideDispatchContextById,
  getExclusiveOfferRideForDriver,
  getOpenBoardOfferRides,
  getReservationOfferRides,
  getUserRides,
  getRideWithAddresses,
  getRideBasicInfo,
  getRideByShareToken,
  getRideAvailableSeats,
  getRideHistory,
  // Driver
  getDriverProfiles,
  getDriverDataByProfileIds,
  getTopDrivers,
  getDriverData,
  getDriverStatsDetailed,
  getDriverCompleteProfile,
  getDriverEarnings,
  getCompletedRidePaymentsByDriver,
  getDriverOfferCapabilities,
  // Stats & Checks
  getMobilityStats,
  getMotoboyRuntimeDatabaseChecks,
  getPassengerRating,
  // Conversations
  getMobilityConversations,
  getLastMessage,
  getUnreadCount,
  // Audit
  getRideStateAuditEntries,
  getOperationalVerificationEntries,
  // Types
  type RideDispatchContextRow,
  type ExclusiveOfferRideRow,
  type OpenBoardRideRow,
  type ReservationOfferRideRow,
  type DriverOfferCapabilitiesRow,
  type MotoboyRuntimeDatabaseChecks,
} from "./mobility.queries";

// ============================================================
// 📝 MUTATIONS - Operações de escrita
// ============================================================
export {
  // Rides
  createRide,
  createRideRequest,
  updateRide,
  updateRideWithGuards,
  updateRideIfStatusIn,
  acceptRide,
  startRide,
  completeRide,
  confirmRide,
  cancelRide,
  // Driver
  createAdminDriverProfile,
  updateDriverOnlineStatus,
  updateDriverData,
  deleteDriverNeighborhood,
  deleteDriverServiceArea,
  checkSuspensionExpiry,
  updateDriverLocation,
  // Other
  createEmergencyAlert,
  incrementRideViewCount,
  decrementRideSeats,
} from "./mobility.mutations";

// ============================================================
// 📋 CONSTANTS - Constantes compartilhadas
// ============================================================
export {
  RIDE_STATUS,
  RIDE_MODE,
  SOURCE_TYPE,
  DB_TABLES,
  isValidRideStatus,
  type RideStatus,
  type RideMode,
  type SourceType,
} from "./mobility.constants";
