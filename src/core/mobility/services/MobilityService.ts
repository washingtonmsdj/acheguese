/**
 *  MobilityService - facade SSOT de mobilidade.
 *
 *  Ponto de entrada publico para operacoes de mobilidade.
 *  Delega para modulos especializados por responsabilidade.
 *
 *  Contratos internos:
 *  - Queries: mobility.queries.ts
 *  - Mutations: mobility.mutations.ts
 *  - Helpers: mobility.helpers.ts (formatacao/classificacao somente)
 *  - Lifecycle: RideStateMachine.ts
 *  - Runtime: MobilityRuntimeService.ts
 *
 *  Nao adicionar logica de negocio diretamente neste arquivo.
 *  Use os modulos especializados acima.
 */

export {
  getRidesByPassenger,
  getRidesByDriverProfile,
  getActiveRideByDriverProfile,
  getActiveRide,
  getRideDispatchData,
  getRideWithAddresses,
  getRideBasicInfo,
  getUserRides,
  getRideAvailableSeats,
  getDriverProfiles,
  getDriverDataIdByProfileId,
  getTopDrivers,
  getDriverEarnings,
  getCompletedRidePaymentsByDriver,
  getDriverCompleteProfile,
  getMobilityStats,
  getPassengerRating,
  getMobilityConversations,
} from "./mobility.queries";

export {
  incrementRideViewCount,
  decrementRideSeats,
  updateDriverOnlineStatus,
  checkSuspensionExpiry,
} from "./mobility.mutations";

export {
  isRideActive,
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

export { mobilityService } from "./MobilityRuntimeService";

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
} from "./DriverService";

export {
  RideService,
  rideService,
  type RideRequest,
} from "./RideService";

export {
  ChatService,
  getChatByRideId,
  getMessages,
  sendMessage,
  markMessagesAsRead,
  createChat,
  type RideChat,
  type ChatMessage,
  type SendMessageInput,
  type Conversation,
} from "./ChatService";

export { MobilityLocationService } from "./MobilityLocationService";
export { MobilityRolloutService } from "./MobilityRolloutService";

export * from "./validators";
export * from "./RideCanonicalAdapter";

import * as MobilityQueries from "./mobility.queries";
import * as MobilityMutations from "./mobility.mutations";
import * as MobilityHelpers from "./mobility.helpers";

/**
 * Facade agregada para os hooks de mobilidade.
 * Todos os metodos delegam para queries, mutations e helpers especializados.
 * Regras de lifecycle nao pertencem a esta facade; use RideStateMachine.
 */
export class MobilityFacade {
  static getRidesByPassenger = MobilityQueries.getRidesByPassenger;
  static getRidesByDriverProfile = MobilityQueries.getRidesByDriverProfile;
  static getActiveRideByDriverProfile = MobilityQueries.getActiveRideByDriverProfile;
  static getActiveRide = MobilityQueries.getActiveRide;
  static getRideDispatchData = MobilityQueries.getRideDispatchData;
  static getDriverProfiles = MobilityQueries.getDriverProfiles;
  static getDriverDataIdByProfileId = MobilityQueries.getDriverDataIdByProfileId;
  static getTopDrivers = MobilityQueries.getTopDrivers;
  static getMobilityStats = MobilityQueries.getMobilityStats;
  static getDriverEarnings = MobilityQueries.getDriverEarnings;
  static getCompletedRidePaymentsByDriver = MobilityQueries.getCompletedRidePaymentsByDriver;
  static getDriverCompleteProfile = MobilityQueries.getDriverCompleteProfile;
  static getPassengerRating = MobilityQueries.getPassengerRating;
  static getMobilityConversations = MobilityQueries.getMobilityConversations;
  static getRideWithAddresses = MobilityQueries.getRideWithAddresses;
  static getRideBasicInfo = MobilityQueries.getRideBasicInfo;
  static getRideAvailableSeats = MobilityQueries.getRideAvailableSeats;
  static incrementRideViewCount = MobilityMutations.incrementRideViewCount;
  static decrementRideSeats = MobilityMutations.decrementRideSeats;
  static updateDriverOnlineStatus = MobilityMutations.updateDriverOnlineStatus;
  static checkSuspensionExpiry = MobilityMutations.checkSuspensionExpiry;
  static isRideActive = MobilityHelpers.isRideActive;
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
