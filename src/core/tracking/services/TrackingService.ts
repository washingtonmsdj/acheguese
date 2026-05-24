/**
 * TrackingService - SSOT para rastreio de posição e presença
 *
 * Responsabilidades:
 * - Gerenciar subscriptions de tracking
 * - Coordenar providers de tracking
 * - Manter histórico mínimo
 * - Controlar frequência de atualização
 *
 * Regras:
 * - ZERO acessos diretos ao supabase fora dos providers
 * - Todas as subscriptions passam por aqui
 * - Gerenciamento centralizado de estado
 *
 * Padrão: Banco → Service → Hook → Component
 */
import { logger } from '@/shared/utils/logger';
import { supabase as defaultSupabase } from '@/integrations/supabase';
import { trackError } from '@/shared/utils/errorTracking';
import { TIMEOUTS } from '@/shared/constants';
import type { SupabaseClient } from '@/integrations/supabase';
import type {
  TrackingPosition,
  TrackingSnapshot,
  TrackingHistoryEntry,
  PresenceStatus,
  HeartbeatPayload,
  TrackingSubscription,
  TrackingSubscriptionConfig,
  TrackingProvider,
  TrackingServiceConfig,
  TrackingFilter,
} from '../types';
import { ReconnectionManager, type ConnectionState } from './ReconnectionManager';

interface TrackingRow {
  id?: string;
  lat: number;
  lng: number;
  accuracy?: number | null;
  heading?: number | null;
  speed?: number | null;
  altitude?: number | null;
  updated_at?: string | null;
  timestamp?: string | null;
  created_at?: string | null;
  source?: string | null;
  driver_profile_id?: string | null;
  user_id?: string | null;
  vehicle_id?: string | null;
}

export class TrackingService {
  private static instance: TrackingService;
  private subscriptions = new Map<string, TrackingSubscription>();
  private config: TrackingServiceConfig;
  private heartbeatTimers = new Map<string, NodeJS.Timeout>();
  private supabaseClient: SupabaseClient;
  private reconnectionManager: ReconnectionManager;

  constructor(supabaseClient?: SupabaseClient) {
    this.supabaseClient = supabaseClient || defaultSupabase;
    this.config = {
      defaultUpdateInterval: TIMEOUTS.GPS_LOCATION,
      enableHistory: true,
      historyLimit: 100,
      heartbeatInterval: TIMEOUTS.DEFAULT_REQUEST,
    };
    
    // GATE 4: Inicializar gerenciador de reconexão
    this.reconnectionManager = new ReconnectionManager(this.supabaseClient);
    this.reconnectionManager.start();
    
    // Monitorar mudanças de estado de conexão
    this.reconnectionManager.onConnectionStateChange((state) => {
      this.handleConnectionStateChange(state);
    });
  }

  static getInstance(supabaseClient?: SupabaseClient): TrackingService {
    if (!TrackingService.instance) {
      TrackingService.instance = new TrackingService(supabaseClient);
    }
    return TrackingService.instance;
  }

  /**
   * Configura o serviço
   */
  configure(config: Partial<TrackingServiceConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // ============================================
  // POSITION OPERATIONS
  // ============================================

  /**
   * Obtém posição atual de uma entidade
   * 
   * GATE 2: Mapeamento explícito BANCO → APP
   * - lat → latitude
   * - lng → longitude
   */
  async getCurrentPosition(
    entityId: string,
    entityType: 'driver' | 'user' | 'vehicle' | 'device' = 'driver'
  ): Promise<TrackingPosition | null> {
    try {
      const tableName = this.getTableName(entityType);
      const idField = this.getIdField(entityType);

      const { data, error } = await this.supabaseClient
        .from(tableName)
        .select('*')
        .eq(idField, entityId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      // GATE 2: Conversão explícita BANCO → APP
      return this.mapToPosition(data as TrackingRow);
    } catch (error) {
      logger.error('[TrackingService] Error getting current position:', error);
      return null;
    }
  }

  /**
   * Atualiza posição de uma entidade
   * 
   * GATE 2: Mapeamento explícito APP → BANCO
   * - latitude → lat
   * - longitude → lng
   * 
   * GATE 4: Retry automático em caso de falha
   * GATE 5: Atualiza last_seen_at para motoristas
   */
  async updatePosition(
    entityId: string,
    position: Omit<TrackingPosition, 'timestamp'>,
    entityType: 'driver' | 'user' | 'vehicle' | 'device' = 'driver',
    metadata?: Record<string, unknown>
  ): Promise<void> {
    try {
      const tableName = this.getTableName(entityType);
      const idField = this.getIdField(entityType);

      // GATE 2: Mapeamento explícito para schema do banco
      const updateData = {
        [idField]: entityId,
        lat: position.latitude,           // APP latitude → BANCO lat
        lng: position.longitude,          // APP longitude → BANCO lng
        accuracy: position.accuracy,      // GATE 2: Nova coluna
        heading: position.heading,        // GATE 2: Nova coluna
        speed: position.speed,            // GATE 2: Nova coluna
        altitude: position.altitude,      // GATE 2: Nova coluna
        updated_at: new Date().toISOString(),
        ...metadata,
      };

      const { error } = await this.supabaseClient
        .from(tableName)
        .upsert(updateData, { onConflict: idField });

      if (error) throw error;

      // GATE 5: Atualizar last_seen_at para motoristas
      if (entityType === 'driver') {
        void import('@/core/mobility/services/runtime')
          .then(({ DriverAvailabilityService }) => DriverAvailabilityService.markLastSeen(entityId))
          .catch((error) => {
            logger.warn('[TrackingService] Failed to update driver last_seen_at after position update', {
              entityId,
              error,
            });
          });
      }
    } catch (error) {
      logger.error('[TrackingService] Error updating position:', error);
      
      // GATE 4: Adicionar operação pendente para retry
      this.reconnectionManager.addPendingOperation({
        id: `position-${entityId}-${Date.now()}`,
        type: 'position_update',
        payload: { entityId, position, entityType, metadata },
        timestamp: new Date().toISOString(),
      });
      
      throw error;
    }
  }

  /**
   * Subscreve a atualizações de posição em tempo real
   * 
   * GATE 2: Payload do realtime convertido BANCO → APP
   * - lat → latitude
   * - lng → longitude
   * 
   * GATE 4: Reconexão automática registrada
   */
  subscribeToPosition(
    entityId: string,
    callback: (position: TrackingPosition) => void,
    entityType: 'driver' | 'user' | 'vehicle' | 'device' = 'driver',
    config?: Partial<TrackingSubscriptionConfig>
  ): TrackingSubscription {
    const subscriptionId = `${entityType}-position-${entityId}`;
    const tableName = this.getTableName(entityType);
    const idField = this.getIdField(entityType);

    // Remove subscription existente se houver
    this.unsubscribe(subscriptionId);

    try {
      const channel = this.supabaseClient
        .channel(`tracking-${subscriptionId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: tableName,
            filter: `${idField}=eq.${entityId}`,
          },
          (payload) => {
            if (payload.new) {
              // GATE 2: Conversão explícita BANCO → APP
              const position = this.mapToPosition(payload.new as TrackingRow);
              callback(position);
            }
          }
        )
        .subscribe();

      // GATE 4: Registrar canal para reconexão automática
      this.reconnectionManager.registerChannel(subscriptionId, channel);

      const subscription: TrackingSubscription = {
        id: subscriptionId,
        config: {
          entityId,
          entityType,
          ...config,
        },
        unsubscribe: () => {
          channel.unsubscribe();
          this.reconnectionManager.unregisterChannel(subscriptionId);
          this.subscriptions.delete(subscriptionId);
        },
        isActive: true,
      };

      this.subscriptions.set(subscriptionId, subscription);
      return subscription;
    } catch (error) {
      trackError(error as Error, {
        component: 'TrackingService',
        action: 'subscribeToPosition',
        metadata: { entityId, entityType },
      });
      throw error;
    }
  }

  // ============================================
  // PRESENCE OPERATIONS
  // ============================================

  /**
   * Obtém status de presença
   */
  async getPresence(
    entityId: string,
    entityType: 'driver' | 'user' | 'vehicle' | 'device' = 'driver'
  ): Promise<PresenceStatus> {
    try {
      if (entityType === 'driver') {
        const { mobilityService } = await import('@/core/mobility/services/runtime');
        const stats = await mobilityService.getDriverVerificationStatus(entityId);
        if (!stats) return 'unknown';
        if (!stats.is_online) return 'offline';
        return 'online';
      }

      return 'unknown';
    } catch (error) {
      logger.error('[TrackingService] Error getting presence:', error);
      return 'unknown';
    }
  }

  /**
   * Atualiza status de presença
   */
  async updatePresence(
    entityId: string,
    status: PresenceStatus,
    entityType: 'driver' | 'user' | 'vehicle' | 'device' = 'driver'
  ): Promise<void> {
    try {
      if (entityType === 'driver') {
        const { mobilityService } = await import('@/core/mobility/services/runtime');
        await mobilityService.updateDriverOnlineStatus(entityId, status === 'online' || status === 'busy');
      }
    } catch (error) {
      logger.error('[TrackingService] Error updating presence:', error);
      throw error;
    }
  }

  // ============================================
  // HEARTBEAT
  // ============================================

  /**
   * Envia heartbeat
   * 
   * GATE 5: Atualiza last_seen_at para motoristas
   */
  async sendHeartbeat(payload: HeartbeatPayload): Promise<void> {
    try {
      // Atualiza posição se fornecida
      if (payload.position) {
        await this.updatePosition(
          payload.entityId,
          payload.position,
          payload.entityType
        );
      }

      // Atualiza status se fornecido
      if (payload.status) {
        await this.updatePresence(payload.entityId, payload.status, payload.entityType);
      }

      // GATE 5: Atualizar last_seen_at para motoristas
      if (payload.entityType === 'driver') {
        const { DriverAvailabilityService } = await import('@/core/mobility/services/runtime');
        await DriverAvailabilityService.markLastSeen(payload.entityId);
      }

      logger.debug('[TrackingService] Heartbeat sent:', payload.entityId);
    } catch (error) {
      logger.error('[TrackingService] Error sending heartbeat:', error);
      throw error;
    }
  }

  /**
   * Inicia heartbeat automático
   */
  startHeartbeat(
    entityId: string,
    entityType: 'driver' | 'user' | 'vehicle' | 'device',
    getPosition: () => TrackingPosition | null,
    getStatus?: () => PresenceStatus
  ): void {
    const timerId = `${entityType}-heartbeat-${entityId}`;

    // Para timer existente se houver
    this.stopHeartbeat(entityId, entityType);

    const timer = setInterval(async () => {
      const position = getPosition();
      const status = getStatus?.();

      await this.sendHeartbeat({
        entityId,
        entityType,
        timestamp: new Date().toISOString(),
        position: position || undefined,
        status,
      });
    }, this.config.heartbeatInterval);

    this.heartbeatTimers.set(timerId, timer);
  }

  /**
   * Para heartbeat automático
   */
  stopHeartbeat(
    entityId: string,
    entityType: 'driver' | 'user' | 'vehicle' | 'device'
  ): void {
    const timerId = `${entityType}-heartbeat-${entityId}`;
    const timer = this.heartbeatTimers.get(timerId);
    if (timer) {
      clearInterval(timer);
      this.heartbeatTimers.delete(timerId);
    }
  }

  // ============================================
  // HISTORY
  // ============================================

  /**
   * Obtém histórico de tracking
   * 
   * ⚠️ GATE 2: Histórico não implementado ainda
   * Tabela driver_location_tracking será criada em fase futura
   * 
   * @returns Array vazio por enquanto
   */
  async getHistory(
    entityId: string,
    entityType: 'driver' | 'user' | 'vehicle' | 'device' = 'driver',
    limit: number = 100
  ): Promise<TrackingHistoryEntry[]> {
    // GATE 2: Histórico não suportado ainda
    logger.warn('[TrackingService] getHistory() not supported yet - history table not created');
    return [];
  }

  // ============================================
  // SUBSCRIPTION MANAGEMENT
  // ============================================

  /**
   * Cancela subscription específica
   */
  unsubscribe(subscriptionId: string): void {
    const subscription = this.subscriptions.get(subscriptionId);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(subscriptionId);
    }
  }

  /**
   * Cancela todas as subscriptions
   */
  unsubscribeAll(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.subscriptions.clear();
    this.heartbeatTimers.forEach((timer) => clearInterval(timer));
    this.heartbeatTimers.clear();
    
    // GATE 4: Parar gerenciador de reconexão
    this.reconnectionManager.stop();
  }

  /**
   * Lista subscriptions ativas
   */
  getActiveSubscriptions(): TrackingSubscription[] {
    return Array.from(this.subscriptions.values()).filter((s) => s.isActive);
  }

  // ============================================
  // GATE 4: RECONNECTION & RECOVERY
  // ============================================

  /**
   * Obtém estado da conexão
   */
  getConnectionState(): ConnectionState {
    return this.reconnectionManager.getConnectionState();
  }

  /**
   * Força reconexão manual
   */
  async forceReconnect(): Promise<void> {
    logger.info('[TrackingService] Forcing manual reconnection');
    
    // Parar e reiniciar gerenciador
    this.reconnectionManager.stop();
    this.reconnectionManager.start();
    
    // Recriar todas as subscriptions
    const activeSubscriptions = this.getActiveSubscriptions();
    
    for (const sub of activeSubscriptions) {
      const { entityId, entityType } = sub.config;
      
      // Unsubscribe e resubscribe
      this.unsubscribe(sub.id);
      
      // Nota: callback original foi perdido, precisaria ser armazenado
      // Por enquanto, apenas logamos
      logger.warn('[TrackingService] Subscription needs manual recreation', {
        id: sub.id,
        entityId,
        entityType,
      });
    }
  }

  /**
   * Sincroniza estado após reconexão
   * 
   * GATE 5: Atualiza last_seen_at para motoristas
   */
  async syncStateAfterReconnection(
    entityId: string,
    entityType: 'driver' | 'user' | 'vehicle' | 'device' = 'driver'
  ): Promise<TrackingPosition | null> {
    logger.info('[TrackingService] Syncing state after reconnection', {
      entityId,
      entityType,
    });

    try {
      // Buscar posição mais recente do banco
      const position = await this.getCurrentPosition(entityId, entityType);
      
      if (!position) {
        logger.warn('[TrackingService] No position found after reconnection', {
          entityId,
        });
        return null;
      }

      // Verificar se posição está stale
      const positionAge = Date.now() - new Date(position.timestamp).getTime();
      const isStale = positionAge > 60000; // 1 minuto

      if (isStale) {
        logger.warn('[TrackingService] Position is stale after reconnection', {
          entityId,
          age: positionAge,
        });
      }

      // GATE 5: Atualizar last_seen_at para motoristas
      if (entityType === 'driver') {
        const { DriverAvailabilityService } = await import('@/core/mobility/services/runtime');
        await DriverAvailabilityService.markLastSeen(entityId);
      }

      return position;
    } catch (error) {
      logger.error('[TrackingService] Error syncing state', { error });
      return null;
    }
  }

  /**
   * Trata mudança de estado de conexão
   */
  private handleConnectionStateChange(state: ConnectionState): void {
    logger.info('[TrackingService] Connection state changed', { state });

    if (state.status === 'connected') {
      // Conexão restaurada - reprocessar operações pendentes
      this.retryPendingOperations();
    } else if (state.status === 'failed') {
      // Conexão falhou permanentemente
      logger.error('[TrackingService] Connection failed permanently');
    }
  }

  /**
   * Reprocessa operações pendentes
   */
  private async retryPendingOperations(): Promise<void> {
    const pending = this.reconnectionManager.getPendingOperations();
    
    if (pending.length === 0) {
      return;
    }

    logger.info('[TrackingService] Retrying pending operations', {
      count: pending.length,
    });

    for (const operation of pending) {
      try {
        if (operation.type === 'position_update') {
          const payload = operation.payload as {
            entityId: string;
            position: Omit<TrackingPosition, 'timestamp'>;
            entityType: 'driver' | 'user' | 'vehicle' | 'device';
            metadata?: Record<string, unknown>;
          };
          await this.updatePosition(
            payload.entityId,
            payload.position,
            payload.entityType,
            payload.metadata,
          );
          this.reconnectionManager.removePendingOperation(operation.id);
        } else if (operation.type === 'presence_update') {
          const payload = operation.payload as {
            entityId: string;
            status: PresenceStatus;
            entityType: 'driver' | 'user' | 'vehicle' | 'device';
          };
          await this.updatePresence(payload.entityId, payload.status, payload.entityType);
          this.reconnectionManager.removePendingOperation(operation.id);
        } else if (operation.type === 'heartbeat') {
          await this.sendHeartbeat(operation.payload as unknown as HeartbeatPayload);
          this.reconnectionManager.removePendingOperation(operation.id);
        }
      } catch (error) {
        logger.error('[TrackingService] Failed to retry operation', {
          id: operation.id,
          error,
        });
      }
    }
  }

  // ============================================
  // HELPERS
  // ============================================

  private getTableName(entityType: string): string {
    switch (entityType) {
      case 'driver':
        return 'driver_locations';
      case 'user':
        return 'user_locations';
      case 'vehicle':
        return 'vehicle_locations';
      case 'device':
        return 'device_locations';
      default:
        return 'driver_locations';
    }
  }

  /**
   * ⚠️ GATE 2: Tabelas de histórico não existem ainda
   * Será implementado em fase futura como driver_location_tracking
   */
  private getHistoryTableName(entityType: string): string {
    switch (entityType) {
      case 'driver':
        return 'driver_location_tracking'; // ⚠️ Não existe ainda
      case 'user':
        return 'user_location_history'; // ⚠️ Não existe ainda
      case 'vehicle':
        return 'vehicle_location_history'; // ⚠️ Não existe ainda
      case 'device':
        return 'device_location_history'; // ⚠️ Não existe ainda
      default:
        return 'driver_location_tracking';
    }
  }

  private getIdField(entityType: string): string {
    switch (entityType) {
      case 'driver':
        return 'driver_profile_id';
      case 'user':
        return 'user_id';
      case 'vehicle':
        return 'vehicle_id';
      case 'device':
        return 'device_id';
      default:
        return 'driver_profile_id';
    }
  }

  /**
   * GATE 2: Mapeamento BANCO → APP
   * Converte schema do banco para contrato da aplicação
   * - lat → latitude
   * - lng → longitude
   */
  private mapToPosition(data: TrackingRow): TrackingPosition {
    return {
      latitude: data.lat,              // BANCO lat → APP latitude
      longitude: data.lng,             // BANCO lng → APP longitude
      accuracy: data.accuracy || 0,
      heading: data.heading,
      speed: data.speed,
      altitude: data.altitude,
      timestamp: data.updated_at || data.timestamp || new Date().toISOString(),
    };
  }

  private mapToHistoryEntry(data: TrackingRow): TrackingHistoryEntry {
    return {
      id: data.id ?? '',
      entityId: data.driver_profile_id || data.user_id || data.vehicle_id || '',
      position: this.mapToPosition(data),
      recordedAt: data.created_at || data.updated_at || new Date().toISOString(),
      source: ((data.source as 'manual' | 'gps' | 'network' | undefined) ?? 'gps'),
    };
  }
}

// Singleton instance
export const trackingService = TrackingService.getInstance();


