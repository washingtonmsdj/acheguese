/**
 *  MobilityService - facade SSOT de mobilidade.
 *
 *  Ponto de entrada publico para operacoes de mobilidade.
 *  Delega para modulos especializados por responsabilidade.
 *
 *  Contratos internos:
 *  - Queries: mobility.queries.ts
 *  - Mutations: mobility.mutations.ts
 *  - Helpers: mobility.helpers.ts
 *  - Runtime/admin: MobilityService.impl.ts e MobilityRuntimeService.ts
 *
 *  Nao adicionar logica de negocio diretamente neste arquivo.
 *  Use os modulos especializados acima.
 */

//  ============================================================
//  RE-EXPORTS DAS NOVAS QUERIES
//  ============================================================
export {
  //  Rides
  getActiveRides,
  getRideById,
  getAllRideRequests,
  getRidesByPassenger,
  getRidesByDriverProfile,
  getActiveRideByDriverProfile,
  getActiveRide,
  getRideDispatchData,
  getRideWithAddresses,
  getRideBasicInfo,
  getUserRides,
  getRideAvailableSeats,
  //  Drivers
  getDriverProfiles,
  getDriverDataByProfileIds,
  getTopDrivers,
  getDriverEarnings,
  getCompletedRidePaymentsByDriver,
  getDriverCompleteProfile,
  //  Stats
  getMobilityStats,
  getPassengerRating,
  //  Chat
  getMobilityConversations,} from "./mobility.queries";

//  ============================================================
//  RE-EXPORTS DAS NOVAS MUTATIONS
//  ============================================================
export {
  //  Rides
  incrementRideViewCount,
  decrementRideSeats,
  //  Driver management
  createAdminDriverProfile,
  updateDriverOnlineStatus,
  updateDriverData,
  checkSuspensionExpiry,
} from "./mobility.mutations";

//  ============================================================
//  RE-EXPORTS DOS HELPERS
//  ============================================================
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

//  ============================================================
//  SERVICE READ/WRITE EXPORTS
//  ============================================================
export {
  //  Classe estatica de leitura/admin.
  MobilityService,
  //  Instancia singleton de escrita/runtime.
  mobilityService,
} from "./MobilityService.impl";

//  ============================================================
//  RE-EXPORTS DE SERVICES ESPECIALIZADOS
//  ============================================================
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
} from "./RideService.impl";

//  ============================================================
//  CHAT SERVICE - SSOT
//  ============================================================
export {
  //  Queries
  getChatByRideId,
  getMessages,
  //  Mutations
  sendMessage,
  markMessagesAsRead,
  createChat,
  //  Types
  type RideChat,
  type ChatMessage,
  type SendMessageInput,
} from "./ChatService";

//  Runtime chat service exports.
export { ChatService } from "./ChatService.impl";
export type { Conversation } from "./ChatService";

export { MobilityLocationService } from "./MobilityLocationService";
export { MobilityRolloutService } from "./MobilityRolloutService";

//  ============================================================
//  RE-EXPORTS DE VALIDATORS E ADAPTERS
//  ============================================================
export * from "./validators";
export * from "./RideCanonicalAdapter";

//  ============================================================
//  FACADE AGREGADA DO MODULO
//  ============================================================

import * as MobilityQueries from "./mobility.queries";
import * as MobilityMutations from "./mobility.mutations";
import * as MobilityHelpers from "./mobility.helpers";

/**
 *  Facade agregada para os hooks de mobilidade.
 *  Todos os metodos delegam para queries, mutations e helpers especializados.
 */
export class MobilityFacade {
  //  ===== QUERIES =====
  static getActiveRides = MobilityQueries.getActiveRides;
  static getRideById = MobilityQueries.getRideById;
  static getAllRideRequests = MobilityQueries.getAllRideRequests;
  static getRidesByPassenger = MobilityQueries.getRidesByPassenger;
  static getRidesByDriverProfile = MobilityQueries.getRidesByDriverProfile;
  static getActiveRideByDriverProfile =
    MobilityQueries.getActiveRideByDriverProfile;
  static getActiveRide = MobilityQueries.getActiveRide;
  static getRideDispatchData = MobilityQueries.getRideDispatchData;
  static getDriverProfiles = MobilityQueries.getDriverProfiles;
  static getDriverDataByProfileIds = MobilityQueries.getDriverDataByProfileIds;
  static getTopDrivers = MobilityQueries.getTopDrivers;
  static getMobilityStats = MobilityQueries.getMobilityStats;
  static getDriverEarnings = MobilityQueries.getDriverEarnings;
  static getCompletedRidePaymentsByDriver =
    MobilityQueries.getCompletedRidePaymentsByDriver;
  static getDriverCompleteProfile = MobilityQueries.getDriverCompleteProfile;
  static getPassengerRating = MobilityQueries.getPassengerRating;
  static getMobilityConversations = MobilityQueries.getMobilityConversations;
  static getUserRides = MobilityQueries.getUserRides;
  static getRideWithAddresses = MobilityQueries.getRideWithAddresses;
  static getRideBasicInfo = MobilityQueries.getRideBasicInfo;
  static getRideAvailableSeats = MobilityQueries.getRideAvailableSeats;
  //  ===== MUTATIONS =====
  static incrementRideViewCount = MobilityMutations.incrementRideViewCount;
  static decrementRideSeats = MobilityMutations.decrementRideSeats;
  static createAdminDriverProfile = MobilityMutations.createAdminDriverProfile;
  static updateDriverOnlineStatus = MobilityMutations.updateDriverOnlineStatus;
  static updateDriverData = MobilityMutations.updateDriverData;
  static checkSuspensionExpiry = MobilityMutations.checkSuspensionExpiry;
  //  ===== HELPERS =====
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
