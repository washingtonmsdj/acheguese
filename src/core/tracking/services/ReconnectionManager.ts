/**
 * GATE 4: RECONNECTION MANAGER
 * 
 * Gerencia reconexão automática de WebSocket/Realtime
 * Recupera estado após desconexão
 * Sincroniza dados perdidos
 * Retry de operações falhadas
 * Detecção de stale state
 */
import { logger } from '@/shared/utils/logger';
import type { SupabaseClient, RealtimeChannel } from '@/integrations/supabase';

// ============================================
// TIPOS
// ============================================

export interface ReconnectionConfig {
  /** Intervalo inicial de retry (ms) */
  initialRetryDelay: number;
  /** Intervalo máximo de retry (ms) */
  maxRetryDelay: number;
  /** Fator de backoff exponencial */
  backoffMultiplier: number;
  /** Número máximo de tentativas */
  maxRetries: number;
  /** Timeout para considerar conexão stale (ms) */
  staleTimeout: number;
  /** Intervalo de health check (ms) */
  healthCheckInterval: number;
}

export interface ConnectionState {
  status: 'connected' | 'disconnected' | 'reconnecting' | 'failed';
  lastConnectedAt?: string;
  lastDisconnectedAt?: string;
  reconnectAttempts: number;
  isStale: boolean;
}

export interface PendingOperation {
  id: string;
  type: 'position_update' | 'presence_update' | 'heartbeat';
  payload: any;
  timestamp: string;
  retries: number;
}

// ============================================
// RECONNECTION MANAGER
// ============================================

export class ReconnectionManager {
  private config: ReconnectionConfig;
  private connectionState: ConnectionState;
  private pendingOperations: Map<string, PendingOperation>;
  private healthCheckTimer?: NodeJS.Timeout;
  private reconnectTimer?: NodeJS.Timeout;
  private channels: Map<string, RealtimeChannel>;
  private supabaseClient: SupabaseClient;
  private onStateChange?: (state: ConnectionState) => void;

  constructor(
    supabaseClient: SupabaseClient,
    config?: Partial<ReconnectionConfig>
  ) {
    this.supabaseClient = supabaseClient;
    this.config = {
      initialRetryDelay: 1000,      // 1s
      maxRetryDelay: 30000,         // 30s
      backoffMultiplier: 2,
      maxRetries: 10,
      staleTimeout: 60000,          // 1min
      healthCheckInterval: 15000,   // 15s
      ...config,
    };

    this.connectionState = {
      status: 'disconnected',
      reconnectAttempts: 0,
      isStale: false,
    };

    this.pendingOperations = new Map();
    this.channels = new Map();
  }

  // ============================================
  // LIFECYCLE
  // ============================================

  /**
   * Inicia monitoramento de conexão
   */
  start(): void {
    logger.info('[ReconnectionManager] Starting connection monitoring');
    
    // Iniciar health check
    this.startHealthCheck();
    
    // Marcar como conectado inicialmente
    this.updateConnectionState('connected');
  }

  /**
   * Para monitoramento de conexão
   */
  stop(): void {
    logger.info('[ReconnectionManager] Stopping connection monitoring');
    
    this.stopHealthCheck();
    this.stopReconnect();
    this.channels.clear();
    this.pendingOperations.clear();
  }

  /**
   * Registra callback de mudança de estado
   */
  onConnectionStateChange(callback: (state: ConnectionState) => void): void {
    this.onStateChange = callback;
  }

  // ============================================
  // CONNECTION MANAGEMENT
  // ============================================

  /**
   * Registra canal para monitoramento
   */
  registerChannel(channelId: string, channel: RealtimeChannel): void {
    this.channels.set(channelId, channel);
    
    // Monitorar eventos do canal
    channel.on('system', {}, (payload) => {
      if (payload.extension === 'postgres_changes') {
        if (payload.status === 'ok') {
          this.handleChannelConnected(channelId);
        } else if (payload.status === 'error') {
          this.handleChannelError(channelId, payload);
        }
      }
    });
  }

  /**
   * Remove canal do monitoramento
   */
  unregisterChannel(channelId: string): void {
    this.channels.delete(channelId);
  }

  /**
   * Reconecta todos os canais
   */
  private async reconnectAllChannels(): Promise<void> {
    logger.info('[ReconnectionManager] Reconnecting all channels', {
      count: this.channels.size,
    });

    const reconnectPromises = Array.from(this.channels.entries()).map(
      async ([channelId, channel]) => {
        try {
          await channel.unsubscribe();
          await channel.subscribe();
          logger.info('[ReconnectionManager] Channel reconnected', { channelId });
        } catch (error) {
          logger.error('[ReconnectionManager] Failed to reconnect channel', {
            channelId,
            error,
          });
        }
      }
    );

    await Promise.allSettled(reconnectPromises);
  }

  // ============================================
  // HEALTH CHECK
  // ============================================

  /**
   * Inicia health check periódico
   */
  private startHealthCheck(): void {
    this.stopHealthCheck();

    this.healthCheckTimer = setInterval(() => {
      this.performHealthCheck();
    }, this.config.healthCheckInterval);
  }

  /**
   * Para health check
   */
  private stopHealthCheck(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = undefined;
    }
  }

  /**
   * Executa health check
   */
  private async performHealthCheck(): Promise<void> {
    try {
      // Verificar se conexão está stale
      const isStale = this.isConnectionStale();
      
      if (isStale && this.connectionState.status === 'connected') {
        logger.info('[ReconnectionManager] Connection is stale, triggering reconnect');
        this.handleDisconnection();
        return;
      }

      // Ping simples para verificar conectividade
      const { error } = await this.supabaseClient
        .from('driver_locations')
        .select('driver_profile_id')
        .limit(1);

      if (error) {
        logger.warn('[ReconnectionManager] Health check failed', { error });
        this.handleDisconnection();
      } else {
        // Conexão OK
        if (this.connectionState.status !== 'connected') {
          this.updateConnectionState('connected');
        }
      }
    } catch (error) {
      logger.error('[ReconnectionManager] Health check error', { error });
      this.handleDisconnection();
    }
  }

  /**
   * Verifica se conexão está stale
   */
  private isConnectionStale(): boolean {
    if (!this.connectionState.lastConnectedAt) {
      return false;
    }

    const lastConnected = new Date(this.connectionState.lastConnectedAt).getTime();
    const now = Date.now();
    const elapsed = now - lastConnected;

    return elapsed > this.config.staleTimeout;
  }

  // ============================================
  // RECONNECTION
  // ============================================

  /**
   * Trata desconexão
   */
  private handleDisconnection(): void {
    if (this.connectionState.status === 'disconnected' || 
        this.connectionState.status === 'reconnecting') {
      return; // Já está tratando
    }

    logger.info('[ReconnectionManager] Connection lost, starting reconnection');
    
    this.updateConnectionState('disconnected');
    this.startReconnect();
  }

  /**
   * Inicia processo de reconexão
   */
  private startReconnect(): void {
    this.stopReconnect();

    const attempt = this.connectionState.reconnectAttempts;
    
    if (attempt >= this.config.maxRetries) {
      logger.error('[ReconnectionManager] Max reconnection attempts reached');
      this.updateConnectionState('failed');
      return;
    }

    // Calcular delay com backoff exponencial
    const delay = Math.min(
      this.config.initialRetryDelay * Math.pow(this.config.backoffMultiplier, attempt),
      this.config.maxRetryDelay
    );

    logger.info('[ReconnectionManager] Scheduling reconnection', {
      attempt: attempt + 1,
      delay,
    });

    this.reconnectTimer = setTimeout(() => {
      this.attemptReconnect();
    }, delay);
  }

  /**
   * Para processo de reconexão
   */
  private stopReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }
  }

  /**
   * Tenta reconectar
   */
  private async attemptReconnect(): Promise<void> {
    this.updateConnectionState('reconnecting');

    try {
      logger.info('[ReconnectionManager] Attempting reconnection', {
        attempt: this.connectionState.reconnectAttempts + 1,
      });

      // Reconectar canais
      await this.reconnectAllChannels();

      // Reprocessar operações pendentes
      await this.retryPendingOperations();

      // GATE 5: Sincronizar status de disponibilidade para motoristas
      // Nota: Precisa ser chamado externamente com driverProfileId específico
      // pois ReconnectionManager não sabe qual motorista está reconectando

      // Sucesso
      logger.info('[ReconnectionManager] Reconnection successful');
      this.updateConnectionState('connected');
      
      // Reset contador de tentativas
      this.connectionState.reconnectAttempts = 0;

    } catch (error) {
      logger.error('[ReconnectionManager] Reconnection failed', { error });
      
      // Incrementar contador e tentar novamente
      this.connectionState.reconnectAttempts++;
      this.startReconnect();
    }
  }

  // ============================================
  // PENDING OPERATIONS
  // ============================================

  /**
   * Adiciona operação pendente
   */
  addPendingOperation(operation: Omit<PendingOperation, 'retries'>): void {
    const pending: PendingOperation = {
      ...operation,
      retries: 0,
    };

    this.pendingOperations.set(operation.id, pending);
    
    logger.debug('[ReconnectionManager] Operation queued', {
      id: operation.id,
      type: operation.type,
    });
  }

  /**
   * Remove operação pendente
   */
  removePendingOperation(operationId: string): void {
    this.pendingOperations.delete(operationId);
  }

  /**
   * Reprocessa operações pendentes
   */
  private async retryPendingOperations(): Promise<void> {
    if (this.pendingOperations.size === 0) {
      return;
    }

    logger.info('[ReconnectionManager] Retrying pending operations', {
      count: this.pendingOperations.size,
    });

    const operations = Array.from(this.pendingOperations.values());
    
    for (const operation of operations) {
      try {
        await this.retryOperation(operation);
        this.pendingOperations.delete(operation.id);
      } catch (error) {
        logger.error('[ReconnectionManager] Failed to retry operation', {
          id: operation.id,
          error,
        });
        
        operation.retries++;
        
        // Remover se excedeu tentativas
        if (operation.retries >= this.config.maxRetries) {
          logger.error('[ReconnectionManager] Operation max retries exceeded', {
            id: operation.id,
          });
          this.pendingOperations.delete(operation.id);
        }
      }
    }
  }

  /**
   * Tenta executar operação novamente
   */
  private async retryOperation(operation: PendingOperation): Promise<void> {
    logger.debug('[ReconnectionManager] Retrying operation', {
      id: operation.id,
      type: operation.type,
      retry: operation.retries + 1,
    });

    // Implementação específica por tipo será feita pelo TrackingService
    // Este método é um placeholder para a interface
    throw new Error('Operation retry must be implemented by caller');
  }

  // ============================================
  // STATE MANAGEMENT
  // ============================================

  /**
   * Atualiza estado da conexão
   */
  private updateConnectionState(status: ConnectionState['status']): void {
    const now = new Date().toISOString();
    
    if (status === 'connected') {
      this.connectionState.lastConnectedAt = now;
      this.connectionState.isStale = false;
    } else if (status === 'disconnected') {
      this.connectionState.lastDisconnectedAt = now;
    }

    this.connectionState.status = status;

    logger.info('[ReconnectionManager] Connection state changed', {
      status,
      reconnectAttempts: this.connectionState.reconnectAttempts,
    });

    // Notificar callback
    if (this.onStateChange) {
      this.onStateChange({ ...this.connectionState });
    }
  }

  /**
   * Obtém estado atual da conexão
   */
  getConnectionState(): ConnectionState {
    return { ...this.connectionState };
  }

  /**
   * Obtém operações pendentes
   */
  getPendingOperations(): PendingOperation[] {
    return Array.from(this.pendingOperations.values());
  }

  // ============================================
  // EVENT HANDLERS
  // ============================================

  /**
   * Trata conexão de canal
   */
  private handleChannelConnected(channelId: string): void {
    logger.info('[ReconnectionManager] Channel connected', { channelId });
    
    if (this.connectionState.status !== 'connected') {
      this.updateConnectionState('connected');
    }
  }

  /**
   * Trata erro de canal
   */
  private handleChannelError(channelId: string, payload: any): void {
    logger.error('[ReconnectionManager] Channel error', { channelId, payload });
    this.handleDisconnection();
  }
}
