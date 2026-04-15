/**
 * 🏆 MOBILITY SERVICE - FACHADA SSOT
 *
 * ✅ Ponto único de entrada para operações de mobilidade
 * ✅ Mantém compatibilidade com código existente
 * ✅ Delega para módulos especializados por responsabilidade
 *
 * REFATORAÇÃO v5.0.0:
 * - Queries → mobility.queries.ts
 * - Mutations → mobility.mutations.ts
 * - Helpers → mobility.helpers.ts
 * - Admin/Verification/Availability → mantidos como estão
 *
 * ⚠️ NÃO adicionar lógica diretamente neste arquivo.
 * Use os módulos especializados acima.
 */

// ============================================================
// RE-EXPORTS DAS NOVAS QUERIES
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
  getAvailableRides,
  getRideWithAddresses,
  getRideBasicInfo,
  getRideByShareToken,
  getUserRides,
  getRideAvailableSeats,
  // Drivers
  getDriverProfiles,
  getDriverDataByProfileIds,
  getTopDrivers,
  getDriverEarnings,
  getCompletedRidePaymentsByDriver,
  getDriverCompleteProfile,
  // Stats
  getMobilityStats,
  getPassengerRating,
  // Chat
  getMobilityConversations,
  getLastMessage,
  getUnreadCount,
  // Deprecated stubs
  getRideHistory,
  getDriverLocation,
} from "./mobility.queries";

// ============================================================
// RE-EXPORTS DAS NOVAS MUTATIONS
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
  createEmergencyAlert,
  incrementRideViewCount,
  decrementRideSeats,
  // Driver areas
  deleteDriverNeighborhood,
  deleteDriverServiceArea,
  // Driver management
  createAdminDriverProfile,
  updateDriverOnlineStatus,
  updateDriverData,
  checkSuspensionExpiry,
  // Location
  updateDriverLocation,
} from "./mobility.mutations";

// ============================================================
// RE-EXPORTS DOS HELPERS
// ============================================================
export {
  isRideActive,
  canAcceptRide,
  canStartRide,
  canCompleteRide,
  canCancelRide,
  calculateEstimatedFare,
  calculateDistanceKm,
  formatDuration,
  formatPrice,
  generateShareToken,
  isValidCoordinate,
  getInitials,
  truncateText,
  getRideStatusLabel,
  getRideStatusColor,
} from "./mobility.helpers";

// ============================================================
// RE-EXPORTS LEGADOS (mantidos para compatibilidade)
// ============================================================
export {
  // Classe estática (queries antigas)
  MobilityService,
  // Instância (mutations e operações runtime)
  mobilityService,
} from "./MobilityService.impl";

// ============================================================
// RE-EXPORTS DE SERVICES ESPECIALIZADOS
// ============================================================
export {
  DriverAvailabilityService,
  AVAILABILITY_CONFIG,
  type AvailabilityStatus,
} from "./DriverAvailabilityService";

export {
  OperationalVerificationService,
  type ServiceResult,
} from "./OperationalVerificationService";

export {
  MobilityAdminQueryService,
  type RawCommunityPost,
  type RawPostFlag,
  type RawDriverProfile,
  type RawRide,
} from "./MobilityAdminQueryService";

export {
  DriverService,
  driverService,
  type DriverProfile,
  type DriverStats,
  type WeeklyEarning,
} from "./DriverService.impl";

export {
  RideService,
  rideService,
  type RideRequest,
  type CreateRideData,
  type UpdateRideData,
} from "./RideService.impl";

// ============================================================
// CHAT SERVICE - SSOT v2.0
// ============================================================
export {
  // Queries
  getChatByRideId,
  getMessages,
  // Mutations
  sendMessage,
  markMessagesAsRead,
  createChat,
  // Types
  type RideChat,
  type ChatMessage,
  type SendMessageInput,
  // Legacy facade
  ChatFacade,
} from "./ChatService";

// Legacy compatibility exports
export {
  ChatService,
  chatService,
} from "./ChatService.impl";
export type { Conversation } from "./ChatService";

export { MobilityLocationService } from "./MobilityLocationService";
export { MobilityRolloutService } from "./MobilityRolloutService";
export { MobilityAuditService } from "./MobilityAuditService";

// ============================================================
// RE-EXPORTS DE VALIDATORS E ADAPTERS
// ============================================================
export * from "./validators";
export * from "./RideCanonicalAdapter";

// ============================================================
// FACHADA UNIFICADA (classe para uso direto nos hooks)
// ============================================================

import * as MobilityQueries from "./mobility.queries";
import * as MobilityMutations from "./mobility.mutations";
import * as MobilityHelpers from "./mobility.helpers";

/**
 * @deprecated Use os exports diretos dos módulos.
 * MobilityFacade como classe estática mantida para compatibilidade.
 * Todos os métodos delegam para queries/mutations/helpers.
 */
export class MobilityFacade {
  // ===== QUERIES =====
  static getActiveRides = MobilityQueries.getActiveRides;
  static getRideById = MobilityQueries.getRideById;
  static getAllRideRequests = MobilityQueries.getAllRideRequests;
  static getRidesByPassenger = MobilityQueries.getRidesByPassenger;
  static getRidesByDriverProfile = MobilityQueries.getRidesByDriverProfile;
  static getActiveRideByDriverProfile = MobilityQueries.getActiveRideByDriverProfile;
  static getActiveRide = MobilityQueries.getActiveRide;
  static getRideDispatchData = MobilityQueries.getRideDispatchData;
  static getDriverProfiles = MobilityQueries.getDriverProfiles;
  static getDriverDataByProfileIds = MobilityQueries.getDriverDataByProfileIds;
  static getTopDrivers = MobilityQueries.getTopDrivers;
  static getMobilityStats = MobilityQueries.getMobilityStats;
  static getDriverEarnings = MobilityQueries.getDriverEarnings;
  static getCompletedRidePaymentsByDriver = MobilityQueries.getCompletedRidePaymentsByDriver;
  static getDriverCompleteProfile = MobilityQueries.getDriverCompleteProfile;
  static getPassengerRating = MobilityQueries.getPassengerRating;
  static getMobilityConversations = MobilityQueries.getMobilityConversations;
  static getLastMessage = MobilityQueries.getLastMessage;
  static getUnreadCount = MobilityQueries.getUnreadCount;
  static getAvailableRides = MobilityQueries.getAvailableRides;
  static getUserRides = MobilityQueries.getUserRides;
  static getRideWithAddresses = MobilityQueries.getRideWithAddresses;
  static getRideBasicInfo = MobilityQueries.getRideBasicInfo;
  static getRideByShareToken = MobilityQueries.getRideByShareToken;
  static getRideAvailableSeats = MobilityQueries.getRideAvailableSeats;
  static getRideHistory = MobilityQueries.getRideHistory;
  static getDriverLocation = MobilityQueries.getDriverLocation;

  // ===== MUTATIONS =====
  static createRide = MobilityMutations.createRide;
  static createRideRequest = MobilityMutations.createRideRequest;
  static updateRide = MobilityMutations.updateRide;
  static updateRideWithGuards = MobilityMutations.updateRideWithGuards;
  static updateRideIfStatusIn = MobilityMutations.updateRideIfStatusIn;
  static acceptRide = MobilityMutations.acceptRide;
  static startRide = MobilityMutations.startRide;
  static completeRide = MobilityMutations.completeRide;
  static confirmRide = MobilityMutations.confirmRide;
  static cancelRide = MobilityMutations.cancelRide;
  static createEmergencyAlert = MobilityMutations.createEmergencyAlert;
  static incrementRideViewCount = MobilityMutations.incrementRideViewCount;
  static decrementRideSeats = MobilityMutations.decrementRideSeats;
  static deleteDriverNeighborhood = MobilityMutations.deleteDriverNeighborhood;
  static deleteDriverServiceArea = MobilityMutations.deleteDriverServiceArea;
  static createAdminDriverProfile = MobilityMutations.createAdminDriverProfile;
  static updateDriverOnlineStatus = MobilityMutations.updateDriverOnlineStatus;
  static updateDriverData = MobilityMutations.updateDriverData;
  static checkSuspensionExpiry = MobilityMutations.checkSuspensionExpiry;
  static updateDriverLocation = MobilityMutations.updateDriverLocation;

  // ===== HELPERS =====
  static isRideActive = MobilityHelpers.isRideActive;
  static canAcceptRide = MobilityHelpers.canAcceptRide;
  static canStartRide = MobilityHelpers.canStartRide;
  static canCompleteRide = MobilityHelpers.canCompleteRide;
  static canCancelRide = MobilityHelpers.canCancelRide;
  static calculateEstimatedFare = MobilityHelpers.calculateEstimatedFare;
  static calculateDistanceKm = MobilityHelpers.calculateDistanceKm;
  static formatDuration = MobilityHelpers.formatDuration;
  static formatPrice = MobilityHelpers.formatPrice;
  static generateShareToken = MobilityHelpers.generateShareToken;
  static isValidCoordinate = MobilityHelpers.isValidCoordinate;
  static getInitials = MobilityHelpers.getInitials;
  static truncateText = MobilityHelpers.truncateText;
  static getRideStatusLabel = MobilityHelpers.getRideStatusLabel;
  static getRideStatusColor = MobilityHelpers.getRideStatusColor;
}

// Alias para compatibilidade com código que importa diretamente
export { MobilityFacade as UnifiedMobilityService };

