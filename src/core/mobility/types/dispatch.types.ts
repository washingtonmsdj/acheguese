/**
 * DISPATCH TYPES - contratos do sistema de dispatch hibrido.
 *
 * Regra de privacidade: todo objeto de oferta e PRE-ACEITE. Ele pode carregar
 * apenas rota aproximada, dados economicos/capacidade e decisoes anonimas de
 * confianca. Identidade, contato, ids internos, texto livre e endereco exato
 * pertencem ao contrato de corrida depois do aceite.
 */

import { RIDE_MODE, SOURCE_TYPE } from '../constants';
import type { TrustDispatchPolicy, TrustRiskLevel } from '@/core/trust';

export type DispatchStrategy =
  | 'exclusive_offer'
  | 'open_board'
  | 'reservation_board';

export interface DispatchContext {
  rideMode: typeof RIDE_MODE[keyof typeof RIDE_MODE];
  sourceType: typeof SOURCE_TYPE[keyof typeof SOURCE_TYPE];
  isScheduled: boolean;
  isImmediate: boolean;
  scheduledFor?: string;
}

export interface DispatchConfig {
  strategy: DispatchStrategy;
  offerTimeoutSeconds: number;
  maxRetryAttempts: number;
  searchRadiusKm: number;
  requiresVerification: boolean;
  requiresSubscription: boolean;
  allowsConcurrentOffers: boolean;
  /** Must remain false for browser-facing pre-accept offer contracts. */
  showFullDetails: boolean;
}

type CoarseOfferRoute = {
  /** Canonical region/location label, never the raw street address. */
  origin: string;
  /** Canonical region/location label, never the raw street address. */
  destination: string;
  /** Approximate 2-decimal coordinates from the broker privacy boundary. */
  originLat?: number;
  originLng?: number;
  destinationLat?: number;
  destinationLng?: number;
  locationPrecision: 'coarse_2dp';
};

/** Exclusive passenger-ride offer shown before explicit driver acceptance. */
export interface ExclusiveOffer extends CoarseOfferRoute {
  id: string;
  rideId: string;
  driverProfileId: string;
  offeredAt: string;
  expiresAt: string;
  attemptNumber: number;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  originNeighborhood: string;
  destinationNeighborhood: string;
  estimatedDistance: number;
  estimatedDuration: number;
  suggestedPrice: number;
  paymentMethod: string;
  driverTrustRiskLevel?: TrustRiskLevel;
  driverDispatchPolicy?: TrustDispatchPolicy;
  passengerTrustRiskLevel?: TrustRiskLevel;
  passengerDispatchPolicy?: TrustDispatchPolicy;

  /** Explicitly forbidden in the pre-accept contract. */
  passengerRating?: never;
  passengerTrustLevel?: never;
  passengerName?: never;
  passengerPhone?: never;
}

/** Open-board delivery offer shown before courier acceptance. */
export interface OpenBoardOffer extends CoarseOfferRoute {
  id: string;
  rideId: string;
  createdAt: string;
  expiresAt: string;
  packageSize?: string;
  estimatedDistance: number;
  estimatedDuration: number;
  suggestedPrice: number;
  paymentMethod: string;
  requiredVehicleType?: string;
  requiredCapacity?: string;
  priority: number;
  trustAdjustedPriority?: number;
  driverTrustRiskLevel?: TrustRiskLevel;
  driverDispatchPolicy?: TrustDispatchPolicy;
  customerTrustRiskLevel?: TrustRiskLevel;
  customerDispatchPolicy?: TrustDispatchPolicy;

  /** Requester-controlled or identifying data must never leave the offer broker. */
  packageDescription?: never;
  customerName?: never;
  customerRating?: never;
  customerPhone?: never;
}

/** Scheduled ride offer. Scheduling does not relax pre-accept privacy. */
export interface ReservationOffer extends CoarseOfferRoute {
  id: string;
  rideId: string;
  scheduledFor: string;
  createdAt: string;
  estimatedDistance: number;
  estimatedDuration: number;
  suggestedPrice: number;
  paymentMethod: string;
  driverTrustRiskLevel?: TrustRiskLevel;
  driverDispatchPolicy?: TrustDispatchPolicy;
  passengerTrustRiskLevel?: TrustRiskLevel;
  passengerDispatchPolicy?: TrustDispatchPolicy;
  status: 'open' | 'reserved' | 'confirmed' | 'cancelled';

  /** Explicitly forbidden until an accepted participant relationship exists. */
  passengerName?: never;
  passengerRating?: never;
  passengerPhone?: never;
  acceptedBy?: never;
  acceptedAt?: never;
}

export interface DriverEligibilityCriteria {
  isVerified: boolean;
  isOnline: boolean;
  isAvailable: boolean;
  hasActiveRide: boolean;
  isSubscriptionActive: boolean;
  isSuspended: boolean;
  currentLat?: number;
  currentLng?: number;
  distanceFromOrigin?: number;
  canDoDelivery: boolean;
  vehicleType?: string;
  vehicleCapacity?: number;
  serviceNeighborhoods?: string[];
  serviceRadius?: number;
  rating: number;
  totalRides: number;
  acceptanceRate: number;
  cancellationRate: number;
}

export interface EligibilityResult {
  isEligible: boolean;
  reasons: string[];
  score?: number;
}

export interface DispatchAttemptResult {
  success: boolean;
  rideId: string;
  driverProfileId?: string;
  attemptNumber: number;
  strategy: DispatchStrategy;
  reason?: 'accepted' | 'rejected' | 'timeout' | 'expired' | 'no_drivers' | 'error';
  error?: string;
  timestamp: string;
}

export interface DispatchFinalResult {
  success: boolean;
  rideId: string;
  driverProfileId?: string;
  totalAttempts: number;
  strategy: DispatchStrategy;
  reason: 'accepted' | 'expired' | 'no_drivers' | 'cancelled' | 'error';
  error?: string;
  startedAt: string;
  completedAt: string;
  attempts: DispatchAttemptResult[];
}

export interface DispatchLock {
  rideId: string;
  lockedBy: 'system' | 'driver';
  lockedAt: string;
  expiresAt: string;
  driverProfileId?: string;
}

export interface AcceptOfferResult {
  success: boolean;
  rideId: string;
  driverProfileId: string;
  reason?: 'accepted' | 'already_accepted' | 'expired' | 'invalid_state' | 'driver_busy' | 'not_eligible';
  error?: string;
  acceptedAt?: string;
}

export interface DriverScoreFactors {
  distance: number;
  rating: number;
  acceptanceRate: number;
  totalRides: number;
  responseTime: number;
}

export interface DriverScore {
  driverProfileId: string;
  totalScore: number;
  factors: DriverScoreFactors;
  rank: number;
}

export interface OpenBoardFilters {
  rideMode?: typeof RIDE_MODE[keyof typeof RIDE_MODE];
  sourceType?: typeof SOURCE_TYPE[keyof typeof SOURCE_TYPE];
  maxDistance?: number;
  minPrice?: number;
  maxPrice?: number;
  packageSize?: string[];
  priority?: number[];
  neighborhoods?: string[];
}

export type OpenBoardSortBy =
  | 'distance'
  | 'price'
  | 'priority'
  | 'created_at'
  | 'score';

export interface OpenBoardSort {
  sortBy: OpenBoardSortBy;
  order: 'asc' | 'desc';
}

export interface DispatchGlobalConfig {
  exclusiveOffer: {
    enabled: boolean;
    offerTimeoutSeconds: number;
    maxRetryAttempts: number;
    searchRadiusKm: number;
    requiresVerification: boolean;
    requiresSubscription: boolean;
  };
  openBoard: {
    enabled: boolean;
    maxOffersPerDriver: number;
    offerExpirationMinutes: number;
    searchRadiusKm: number;
    requiresVerification: boolean;
    requiresSubscription: boolean;
  };
  reservationBoard: {
    enabled: boolean;
    minAdvanceHours: number;
    maxAdvanceDays: number;
    requiresVerification: boolean;
    requiresSubscription: boolean;
  };
  scoring: {
    distanceWeight: number;
    ratingWeight: number;
    acceptanceRateWeight: number;
    totalRidesWeight: number;
    responseTimeWeight: number;
  };
}
