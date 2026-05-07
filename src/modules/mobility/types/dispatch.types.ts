/**
 * DISPATCH TYPES - Tipos para sistema de dispatch híbrido
 * 
 * Modelo Híbrido:
 * 1. Corrida imediata de passageiro → Oferta exclusiva (1 motorista por vez)
 * 2. Entrega/motoboy → Lista aberta (múltiplos motoristas veem)
 * 3. Corridas agendadas → Reserva (motoristas podem aceitar previamente)
 */

import { RIDE_MODE, SOURCE_TYPE } from '../constants';
import type { TrustDispatchPolicy, TrustRiskLevel } from '@/core/trust';

// ============================================
// DISPATCH STRATEGY
// ============================================

/**
 * Estratégia de dispatch baseada no tipo de solicitação
 */
export type DispatchStrategy = 
  | 'exclusive_offer'    // Oferta exclusiva - 1 motorista por vez
  | 'open_board'         // Lista aberta - múltiplos motoristas
  | 'reservation_board'; // Reserva - agendamento prévio

/**
 * Contexto da solicitação para determinar estratégia
 */
export interface DispatchContext {
  rideMode: typeof RIDE_MODE[keyof typeof RIDE_MODE];
  sourceType: typeof SOURCE_TYPE[keyof typeof SOURCE_TYPE];
  isScheduled: boolean;
  isImmediate: boolean;
  scheduledFor?: string;
}

/**
 * Configuração de dispatch por estratégia
 */
export interface DispatchConfig {
  strategy: DispatchStrategy;
  offerTimeoutSeconds: number;
  maxRetryAttempts: number;
  searchRadiusKm: number;
  requiresVerification: boolean;
  requiresSubscription: boolean;
  allowsConcurrentOffers: boolean;
  showFullDetails: boolean; // Se mostra origem/destino completos antes de aceitar
}

// ============================================
// OFFER TYPES
// ============================================

/**
 * Oferta exclusiva para motorista específico
 */
export interface ExclusiveOffer {
  id: string;
  rideId: string;
  driverProfileId: string;
  offeredAt: string;
  expiresAt: string;
  attemptNumber: number;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  
  // Dados protegidos (apenas após aceite)
  origin: string;
  destination: string;
  originLat?: number;
  originLng?: number;
  destinationLat?: number;
  destinationLng?: number;
  
  // Dados públicos (antes do aceite)
  originNeighborhood: string;
  destinationNeighborhood: string;
  estimatedDistance: number;
  estimatedDuration: number;
  suggestedPrice: number;
  paymentMethod: string;
  passengerRating?: number;
  passengerTrustLevel?: string;
  driverTrustRiskLevel?: TrustRiskLevel;
  driverDispatchPolicy?: TrustDispatchPolicy;
  passengerTrustRiskLevel?: TrustRiskLevel;
  passengerDispatchPolicy?: TrustDispatchPolicy;
}

/**
 * Pedido na lista aberta (motoboy/entrega)
 */
export interface OpenBoardOffer {
  id: string;
  rideId: string;
  createdAt: string;
  expiresAt: string;
  
  // Dados completos (visíveis antes do aceite)
  origin: string;
  destination: string;
  originLat: number;
  originLng: number;
  destinationLat: number;
  destinationLng: number;
  
  // Metadados
  packageSize?: string;
  packageDescription?: string;
  estimatedDistance: number;
  estimatedDuration: number;
  suggestedPrice: number;
  paymentMethod: string;
  
  // Filtros
  requiredVehicleType?: string;
  requiredCapacity?: string;
  priority: number;
  trustAdjustedPriority?: number;
  driverTrustRiskLevel?: TrustRiskLevel;
  driverDispatchPolicy?: TrustDispatchPolicy;
  
  // Cliente
  customerName: string;
  customerRating?: number;
  customerPhone?: string; // Apenas após aceite
  customerTrustRiskLevel?: TrustRiskLevel;
  customerDispatchPolicy?: TrustDispatchPolicy;
}

/**
 * Reserva de corrida agendada
 */
export interface ReservationOffer {
  id: string;
  rideId: string;
  scheduledFor: string;
  createdAt: string;
  
  // Dados completos (agendamento permite transparência)
  origin: string;
  destination: string;
  originLat: number;
  originLng: number;
  destinationLat: number;
  destinationLng: number;
  
  // Metadados
  estimatedDistance: number;
  estimatedDuration: number;
  suggestedPrice: number;
  paymentMethod: string;
  
  // Passageiro
  passengerName: string;
  passengerRating?: number;
  passengerPhone?: string; // Apenas após aceite
  driverTrustRiskLevel?: TrustRiskLevel;
  driverDispatchPolicy?: TrustDispatchPolicy;
  passengerTrustRiskLevel?: TrustRiskLevel;
  passengerDispatchPolicy?: TrustDispatchPolicy;
  
  // Status
  acceptedBy?: string;
  acceptedAt?: string;
  status: 'open' | 'reserved' | 'confirmed' | 'cancelled';
}

// ============================================
// DRIVER ELIGIBILITY
// ============================================

/**
 * Critérios de elegibilidade do motorista
 */
export interface DriverEligibilityCriteria {
  isVerified: boolean;
  isOnline: boolean;
  isAvailable: boolean;
  hasActiveRide: boolean;
  isSubscriptionActive: boolean;
  isSuspended: boolean;
  
  // Localização
  currentLat?: number;
  currentLng?: number;
  distanceFromOrigin?: number;
  
  // Capacidades
  canDoDelivery: boolean;
  vehicleType?: string;
  vehicleCapacity?: number;
  
  // Área de atendimento
  serviceNeighborhoods?: string[];
  serviceRadius?: number;
  
  // Reputação
  rating: number;
  totalRides: number;
  acceptanceRate: number;
  cancellationRate: number;
}

/**
 * Resultado de validação de elegibilidade
 */
export interface EligibilityResult {
  isEligible: boolean;
  reasons: string[];
  score?: number; // Score para ordenação
}

// ============================================
// DISPATCH RESULTS
// ============================================

/**
 * Resultado de tentativa de dispatch
 */
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

/**
 * Resultado final de dispatch
 */
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

// ============================================
// CONCURRENCY CONTROL
// ============================================

/**
 * Lock para controle de concorrência
 */
export interface DispatchLock {
  rideId: string;
  lockedBy: 'system' | 'driver';
  lockedAt: string;
  expiresAt: string;
  driverProfileId?: string;
}

/**
 * Resultado de tentativa de aceite
 */
export interface AcceptOfferResult {
  success: boolean;
  rideId: string;
  driverProfileId: string;
  reason?: 'accepted' | 'already_accepted' | 'expired' | 'invalid_state' | 'driver_busy' | 'not_eligible';
  error?: string;
  acceptedAt?: string;
}

// ============================================
// SCORING & RANKING
// ============================================

/**
 * Fatores para score de motorista
 */
export interface DriverScoreFactors {
  distance: number;        // Peso: 40%
  rating: number;          // Peso: 25%
  acceptanceRate: number;  // Peso: 15%
  totalRides: number;      // Peso: 10%
  responseTime: number;    // Peso: 10%
}

/**
 * Score calculado do motorista
 */
export interface DriverScore {
  driverProfileId: string;
  totalScore: number;
  factors: DriverScoreFactors;
  rank: number;
}

// ============================================
// FILTERS & SORTING
// ============================================

/**
 * Filtros para lista aberta
 */
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

/**
 * Ordenação para lista aberta
 */
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

// ============================================
// CONFIGURATION
// ============================================

/**
 * Configuração global de dispatch
 */
export interface DispatchGlobalConfig {
  // Exclusive Offer (Corrida imediata)
  exclusiveOffer: {
    enabled: boolean;
    offerTimeoutSeconds: number;
    maxRetryAttempts: number;
    searchRadiusKm: number;
    requiresVerification: boolean;
    requiresSubscription: boolean;
  };
  
  // Open Board (Entrega/motoboy)
  openBoard: {
    enabled: boolean;
    maxOffersPerDriver: number;
    offerExpirationMinutes: number;
    searchRadiusKm: number;
    requiresVerification: boolean;
    requiresSubscription: boolean;
  };
  
  // Reservation Board (Agendadas)
  reservationBoard: {
    enabled: boolean;
    minAdvanceHours: number;
    maxAdvanceDays: number;
    requiresVerification: boolean;
    requiresSubscription: boolean;
  };
  
  // Scoring
  scoring: {
    distanceWeight: number;
    ratingWeight: number;
    acceptanceRateWeight: number;
    totalRidesWeight: number;
    responseTimeWeight: number;
  };
}
