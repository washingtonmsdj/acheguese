/**
 * MOBILITY CORE CONSTANTS — SSOT v3.0
 *
 * Centralização de constantes para operações de mobilidade no core
 * Extraído de modules/mobility/constants para desacoplamento
 *
 * @version 3.0.0 - Core SSOT
 */

// ============================================
// RIDE STATUS - Estados da corrida
// ============================================
export const RIDE_STATUS = {
  // Estados iniciais
  PENDING: 'pending',
  REQUESTED: 'requested',
  SEARCHING_DRIVER: 'searching_driver',

  // Estados de atribuição
  DRIVER_ASSIGNED: 'driver_assigned',
  DRIVER_ACCEPTED: 'driver_accepted',
  DRIVER_ARRIVING: 'driver_arriving',
  DRIVER_ON_THE_WAY: 'driver_on_the_way',
  DRIVER_ARRIVED: 'driver_arrived',

  // Estados de execução (corrida de passageiro)
  PASSENGER_BOARDED: 'passenger_boarded',
  PASSENGER_ON_BOARD: 'passenger_on_board',
  IN_PROGRESS: 'in_progress',

  // Estados de execução (motoboy/entrega)
  PICKUP_CONFIRMED: 'pickup_confirmed',
  IN_DELIVERY: 'in_delivery',
  DELIVERED: 'delivered',
  FAILED_DELIVERY: 'failed_delivery',

  // Estados finais
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  CANCELLED_BY_PASSENGER: 'cancelled_by_passenger',
  CANCELLED_BY_DRIVER: 'cancelled_by_driver',
  EXPIRED: 'expired',
  FAILED: 'failed',
} as const;

export type RideStatus = typeof RIDE_STATUS[keyof typeof RIDE_STATUS];

// ============================================
// RIDE MODE - Modo da solicitação
// ============================================
export const RIDE_MODE = {
  RIDE: 'ride',
  MOTOBOY: 'motoboy',
} as const;

export type RideMode = typeof RIDE_MODE[keyof typeof RIDE_MODE];

// ============================================
// SOURCE TYPE - Origem da solicitação
// ============================================
export const SOURCE_TYPE = {
  PASSENGER: 'passenger',
  BUSINESS: 'business',
  GASTRONOMY: 'gastronomy',
  SERVICE: 'service',
} as const;

export type SourceType = typeof SOURCE_TYPE[keyof typeof SOURCE_TYPE];

// ============================================
// DATABASE TABLES - Nomes das tabelas
// ============================================
export const DB_TABLES = {
  RIDE_REQUESTS: 'ride_requests',
  DRIVER_DATA: 'driver_data',
  DRIVER_AVAILABILITY: 'driver_availability',
  PROFILES: 'profiles',
  ADDRESSES: 'addresses',
  LOCATIONS: 'locations',
  RIDE_STATE_AUDIT: 'ride_state_audit',
  OPERATIONAL_VERIFICATIONS: 'operational_verifications',
  MOBILITY_CONVERSATIONS: 'mobility_conversations',
  MOBILITY_MESSAGES: 'mobility_messages',
} as const;

// ============================================
// VALIDATORS
// ============================================
export function isValidRideStatus(status: string): status is RideStatus {
  return Object.values(RIDE_STATUS).includes(status as RideStatus);
}
