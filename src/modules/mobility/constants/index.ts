/**
 * MOBILITY MODULE CONSTANTS
 * 
 * Centralização de todos os hardcodes do módulo de mobilidade
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
  PICKUP_CONFIRMED: 'pickup_confirmed',   // Motoboy coletou o pacote
  IN_DELIVERY: 'in_delivery',             // Em rota de entrega
  DELIVERED: 'delivered',                 // Entregue com sucesso
  FAILED_DELIVERY: 'failed_delivery',     // Falha na entrega
  
  // Estados finais
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  CANCELLED_BY_PASSENGER: 'cancelled_by_passenger',
  CANCELLED_BY_DRIVER: 'cancelled_by_driver',
  EXPIRED: 'expired',
  FAILED: 'failed',
} as const;

export type RideStatus = typeof RIDE_STATUS[keyof typeof RIDE_STATUS];

// Labels de Status de Corridas
export const RIDE_STATUS_LABELS: Record<string, string> = {
  [RIDE_STATUS.PENDING]: "Aguardando motorista",
  [RIDE_STATUS.REQUESTED]: "Solicitada",
  [RIDE_STATUS.SEARCHING_DRIVER]: "Procurando motorista",
  [RIDE_STATUS.DRIVER_ASSIGNED]: "Motorista atribuído",
  [RIDE_STATUS.DRIVER_ACCEPTED]: "Motorista aceitou",
  [RIDE_STATUS.DRIVER_ARRIVING]: "Motorista chegando",
  [RIDE_STATUS.DRIVER_ON_THE_WAY]: "Motorista a caminho",
  [RIDE_STATUS.DRIVER_ARRIVED]: "Motorista chegou",
  [RIDE_STATUS.PASSENGER_BOARDED]: "Passageiro embarcado",
  [RIDE_STATUS.PASSENGER_ON_BOARD]: "Passageiro a bordo",
  [RIDE_STATUS.IN_PROGRESS]: "Em andamento",
  [RIDE_STATUS.PICKUP_CONFIRMED]: "Coleta confirmada",
  [RIDE_STATUS.IN_DELIVERY]: "Em entrega",
  [RIDE_STATUS.DELIVERED]: "Entregue",
  [RIDE_STATUS.FAILED_DELIVERY]: "Falha na entrega",
  [RIDE_STATUS.COMPLETED]: "Concluída",
  [RIDE_STATUS.CANCELLED]: "Cancelada",
  [RIDE_STATUS.CANCELLED_BY_PASSENGER]: "Cancelada pelo passageiro",
  [RIDE_STATUS.CANCELLED_BY_DRIVER]: "Cancelada pelo motorista",
  [RIDE_STATUS.EXPIRED]: "Expirada",
  [RIDE_STATUS.FAILED]: "Falhou",
};

// Cores de Status de Corridas
export const RIDE_STATUS_COLORS: Record<string, string> = {
  [RIDE_STATUS.PENDING]: "#F59E0B", // amber-500
  [RIDE_STATUS.REQUESTED]: "#F59E0B", // amber-500
  [RIDE_STATUS.SEARCHING_DRIVER]: "#F59E0B", // amber-500
  [RIDE_STATUS.DRIVER_ASSIGNED]: "#3B82F6", // blue-500
  [RIDE_STATUS.DRIVER_ACCEPTED]: "#3B82F6", // blue-500
  [RIDE_STATUS.DRIVER_ARRIVING]: "#8B5CF6", // purple-500
  [RIDE_STATUS.DRIVER_ON_THE_WAY]: "#8B5CF6", // purple-500
  [RIDE_STATUS.DRIVER_ARRIVED]: "#06B6D4", // cyan-500
  [RIDE_STATUS.PASSENGER_BOARDED]: "#10B981", // green-500
  [RIDE_STATUS.PASSENGER_ON_BOARD]: "#10B981", // green-500
  [RIDE_STATUS.IN_PROGRESS]: "#10B981", // green-500
  [RIDE_STATUS.PICKUP_CONFIRMED]: "#10B981", // green-500
  [RIDE_STATUS.IN_DELIVERY]: "#8B5CF6", // purple-500
  [RIDE_STATUS.DELIVERED]: "#10B981", // green-500
  [RIDE_STATUS.FAILED_DELIVERY]: "#EF4444", // red-500
  [RIDE_STATUS.COMPLETED]: "#6B7280", // gray-500
  [RIDE_STATUS.CANCELLED]: "#EF4444", // red-500
  [RIDE_STATUS.CANCELLED_BY_PASSENGER]: "#EF4444", // red-500
  [RIDE_STATUS.CANCELLED_BY_DRIVER]: "#EF4444", // red-500
  [RIDE_STATUS.EXPIRED]: "#6B7280", // gray-500
  [RIDE_STATUS.FAILED]: "#EF4444", // red-500
};

// ============================================
// RIDE MODE - Modo da solicitação
// ============================================
export const RIDE_MODE = {
  RIDE: 'ride',       // Corrida de passageiro
  MOTOBOY: 'motoboy', // Entrega por motoboy
} as const;

// ============================================
// SOURCE TYPE - Origem da solicitação
// ============================================
export const SOURCE_TYPE = {
  PASSENGER: 'passenger',
  BUSINESS: 'business',
  GASTRONOMY: 'gastronomy',
  SERVICE: 'service',
} as const;

// ============================================
// PACKAGE SIZE - Tamanho do pacote
// ============================================
export const PACKAGE_SIZE = {
  SMALL: 'small',   // Envelope, documento
  MEDIUM: 'medium', // Caixa pequena, sacola
  LARGE: 'large',   // Caixa grande
} as const;

// ============================================
// REPORTING - Denuncias e moderacao
// ============================================
export const REPORT_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;

export const REPORT_TYPE = {
  DRIVER_BEHAVIOR: 'driver_behavior',
  SAFETY_CONCERN: 'safety_concern',
  ROUTE_ISSUE: 'route_issue',
  PAYMENT_DISPUTE: 'payment_dispute',
  VEHICLE_CONDITION: 'vehicle_condition',
  CANCELLATION_ABUSE: 'cancellation_abuse',
  HARASSMENT: 'harassment',
  FRAUD: 'fraud',
  OTHER: 'other',
} as const;

// ============================================
// TIMEOUTS & INTERVALS - Configurações de tempo
// ============================================
export const TIMEOUTS = {
  // Realtime & Cache
  CACHE_STALE_TIME_SHORT: 15 * 1000,      // 15s - dados críticos
  CACHE_STALE_TIME_MEDIUM: 30 * 1000,     // 30s - dados normais
  CACHE_STALE_TIME_LONG: 2 * 60 * 1000,   // 2min - estatísticas
  CACHE_STALE_TIME_VERY_LONG: 5 * 60 * 1000, // 5min - dados estáticos
  
  // Dispatch & Offers
  OFFER_TIMEOUT_SECONDS: 30,               // 30s - timeout por motorista
  TOTAL_TIMEOUT_MINUTES: 10,               // 10min - timeout total da corrida
  REQUEST_EXPIRATION_MINUTES: 15,          // 15min - expiração de request
  
  // UI Animations
  ANIMATION_DELAY_SHORT: 300,              // 300ms - animações rápidas
  ANIMATION_DELAY_MEDIUM: 1000,            // 1s - animações normais
  ANIMATION_DELAY_LONG: 2000,              // 2s - feedbacks
  ANIMATION_DELAY_VERY_LONG: 3000,         // 3s - auto-hide
  
  // Location & GPS
  GPS_UPDATE_INTERVAL: 10 * 1000,          // 10s - atualização GPS
  LOCATION_STALE_TIME: 30 * 1000,          // 30s - cache de localização
} as const;

// ============================================
// QUERY KEYS - Chaves centralizadas para React Query
// ============================================
export const MOBILITY_QUERY_KEYS = {
  // Rides
  rides: (userId?: string) => ['rides', userId],
  rideById: (rideId: string) => ['ride', rideId],
  rideBuscando: (rideId: string) => ['ride-buscando', rideId],
  rideHistory: (userId: string, filters?: any, page?: number) => ['ride-history', userId, filters, page],
  activeRide: (userId: string) => ['active-ride', userId],
  pendingRides: () => ['pending-rides'],
  
  // Driver
  motoristaData: (userId: string) => ['motorista-data', userId],
  motoristaRides: (userId: string) => ['motorista-rides', userId],
  motoristaV2Data: (userId: string) => ['motorista-v2-data', userId],
  motoristaV2Rides: (userId: string) => ['motorista-v2-rides', userId],
  availableRides: () => ['motorista-available-rides'],
  driverProfile: (userId: string) => ['driver-profile', userId],
  driverStats: (profileId: string) => ['driver-stats', profileId],
  driverStatsCompact: (profileId: string) => ['driver-stats-compact', profileId],
  driverCompleteProfile: (profileId: string) => ['driver-complete-profile', profileId],
  
  // Passenger
  passengerRating: (userId: string) => ['passengerRating', userId],
  
  // Location & Rollout
  mobilityRollout: (locationId: string) => ['mobility-rollout', locationId],
  mobilityRolloutAccess: (locationId: string) => ['mobility-rollout-access', locationId],
  operationalLocation: (locationId: string) => ['mobility-operational-location', locationId],
  
  // Conversations
  mobilityConversations: (profileId: string) => ['mobility-conversations', profileId],
  lastMessage: (conversationId: string) => ['last-message', conversationId],
  unreadCount: (conversationId: string, profileId: string) => ['unread-count', conversationId, profileId],
  
  // Service Areas
  driverNeighborhoods: () => ['driver-neighborhoods'],
  driverServiceAreas: () => ['driver-service-areas'],
  
  // Community
  communityRidePosts: (filters?: any) => ['community-ride-posts', filters],
  
  // Motoboy / Delivery
  deliveries: (sourceType: string, sourceId: string) => ['deliveries', sourceType, sourceId],
  activeDelivery: (sourceId: string) => ['active-delivery', sourceId],
  deliveryHistory: (sourceId: string) => ['delivery-history', sourceId],
  
  // Generic
  drivers: () => ['drivers'],
  profiles: () => ['profiles'],
  mobility: (type: string) => ['mobility', type],
} as const;

// ============================================
// REALTIME CHANNELS - Nomes dos canais
// ============================================
export const REALTIME_CHANNELS = {
  rideRealtime: (userId: string) => `ride_realtime:${userId}`,
  passenger: (profileId: string) => `passenger:${profileId}`,
  driver: (profileId: string) => `driver:${profileId}`,
} as const;

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
} as const;

// ============================================
// BUSINESS RULES - Regras de negócio
// ============================================
export const BUSINESS_RULES = {
  // Pricing
  MIN_PRICE: 5.00,                         // R$ 5,00 - preço mínimo
  MAX_PRICE: 10000.00,                     // R$ 10.000,00 - preço máximo
  
  // Vehicle
  MIN_VEHICLE_YEAR: 2000,                  // Ano mínimo do veículo
  MAX_VEHICLE_YEAR: 2026,                  // Ano máximo do veículo
  
  // Dispatch
  MAX_RETRY_ATTEMPTS: 5,                   // Máximo de motoristas para tentar
  SEARCH_RADIUS_KM: 10,                    // Raio de busca em km
  
  // Points & Gamification
  MIN_POINTS_FOR_STAR: 1000,               // Pontos mínimos para estrela
  
  // Validation
  MIN_DESCRIPTION_LENGTH: 10,              // Mínimo de caracteres na descrição
  MAX_DESCRIPTION_LENGTH: 1000,            // Máximo de caracteres na descrição
} as const;

// ============================================
// USER TYPES - Tipos de usuário
// ============================================
export const USER_TYPES = {
  PASSENGER: 'passenger',
  DRIVER: 'driver',
} as const;

// ============================================
// RIDE TYPES - Tipos de corrida
// ============================================
export const RIDE_TYPES = {
  RIDE: 'ride',
  DELIVERY: 'delivery',
} as const;

// ============================================
// PAYMENT STATUS - Status de pagamento
// ============================================
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid', 
  FAILED: 'failed',
} as const;

// ============================================
// FILTER TYPES - Tipos de filtro
// ============================================
export const FILTER_TYPES = {
  ALL: 'all',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  AVAILABLE: 'available',
  ACCEPTED: 'accepted',
  HISTORY: 'history',
} as const;

// ============================================
// EXPORTS - Re-exports para compatibilidade
// ============================================
export type UserType = typeof USER_TYPES[keyof typeof USER_TYPES];
export type RideType = typeof RIDE_TYPES[keyof typeof RIDE_TYPES];
export type PaymentStatus = typeof PAYMENT_STATUS[keyof typeof PAYMENT_STATUS];
export type FilterType = typeof FILTER_TYPES[keyof typeof FILTER_TYPES];
export type RideMode = typeof RIDE_MODE[keyof typeof RIDE_MODE];
export type SourceType = typeof SOURCE_TYPE[keyof typeof SOURCE_TYPE];
export type PackageSize = typeof PACKAGE_SIZE[keyof typeof PACKAGE_SIZE];
export type ReportSeverity = typeof REPORT_SEVERITY[keyof typeof REPORT_SEVERITY];
export type ReportType = typeof REPORT_TYPE[keyof typeof REPORT_TYPE];

// ============================================
// VALIDATORS - Funções de validação
// ============================================
export function isValidRideStatus(status: string): status is RideStatus {
  return Object.values(RIDE_STATUS).includes(status as RideStatus);
}
