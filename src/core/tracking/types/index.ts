/**
 * Core Tracking Types
 *
 * Tipos canônicos para rastreio de posição, presença e heartbeat.
 * Única fonte de verdade para tracking no sistema.
 */

// ============================================
// POSITION
// ============================================

/**
 * Posição de tracking com coordenadas e metadados
 */
export interface TrackingPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
  heading?: number;
  speed?: number;
  altitude?: number;
  timestamp: string | Date;
}

/**
 * Snapshot de tracking com contexto adicional
 */
export interface TrackingSnapshot {
  id: string;
  entityId: string;
  entityType: 'driver' | 'user' | 'vehicle' | 'device';
  position: TrackingPosition;
  status: PresenceStatus;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Entrada de histórico de tracking
 */
export interface TrackingHistoryEntry {
  id: string;
  entityId: string;
  position: TrackingPosition;
  recordedAt: string;
  source: 'gps' | 'network' | 'manual';
}

// ============================================
// PRESENCE & STATUS
// ============================================

/**
 * Status de presença de uma entidade
 */
export type PresenceStatus = 
  | 'online'      // Ativo e disponível
  | 'offline'     // Inativo
  | 'busy'        // Ocupado (em atendimento, corrida, etc.)
  | 'away'        // Ausente temporariamente
  | 'unknown';    // Status desconhecido

/**
 * Payload de heartbeat
 */
export interface HeartbeatPayload {
  entityId: string;
  entityType: 'driver' | 'user' | 'vehicle' | 'device';
  timestamp: string;
  position?: TrackingPosition;
  status?: PresenceStatus;
  metadata?: Record<string, unknown>;
}

// ============================================
// SUBSCRIPTION
// ============================================

/**
 * Configuração de subscription de tracking
 */
export interface TrackingSubscriptionConfig {
  entityId: string;
  entityType: 'driver' | 'user' | 'vehicle' | 'device';
  updateInterval?: number; // ms
  enableHistory?: boolean;
  historyLimit?: number;
}

/**
 * Subscription ativa de tracking
 */
export interface TrackingSubscription {
  id: string;
  config: TrackingSubscriptionConfig;
  unsubscribe: () => void;
  isActive: boolean;
}

// ============================================
// PROVIDER CONTRACT
// ============================================

/**
 * Contrato para providers de tracking
 */
export interface TrackingProvider {
  readonly id: string;
  readonly type: 'realtime' | 'polling' | 'hybrid';
  
  // Position operations
  getCurrentPosition(entityId: string): Promise<TrackingPosition | null>;
  subscribeToPosition(
    entityId: string,
    callback: (position: TrackingPosition) => void,
    config?: TrackingSubscriptionConfig
  ): TrackingSubscription;
  
  // Presence operations
  getPresence(entityId: string): Promise<PresenceStatus>;
  updatePresence(entityId: string, status: PresenceStatus): Promise<void>;
  
  // Heartbeat
  sendHeartbeat(payload: HeartbeatPayload): Promise<void>;
  
  // History
  getHistory(entityId: string, limit?: number): Promise<TrackingHistoryEntry[]>;
  
  // Lifecycle
  isAvailable(): boolean;
  connect?(): Promise<void>;
  disconnect?(): Promise<void>;
}

// ============================================
// SERVICE TYPES
// ============================================

/**
 * Configuração do TrackingService
 */
export interface TrackingServiceConfig {
  defaultUpdateInterval: number;
  enableHistory: boolean;
  historyLimit: number;
  heartbeatInterval: number;
}

/**
 * Resultado de operação de tracking
 */
export interface TrackingResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Filtro para queries de tracking
 */
export interface TrackingFilter {
  entityId?: string;
  entityType?: 'driver' | 'user' | 'vehicle' | 'device';
  status?: PresenceStatus;
  withinBounds?: {
    ne: { lat: number; lng: number };
    sw: { lat: number; lng: number };
  };
  updatedAfter?: string;
}