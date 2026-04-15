/**
 * GATE 4: Hook de Estado de Conexão
 * 
 * Expõe estado de conexão e controles de reconexão para componentes React
 */

import { useState, useEffect } from 'react';
import { trackingService } from '../services/TrackingService';
import type { ConnectionState } from '../services/ReconnectionManager';

export interface UseConnectionStateReturn {
  /** Estado atual da conexão */
  connectionState: ConnectionState;
  /** Se está conectado */
  isConnected: boolean;
  /** Se está reconectando */
  isReconnecting: boolean;
  /** Se falhou permanentemente */
  isFailed: boolean;
  /** Se conexão está stale */
  isStale: boolean;
  /** Número de tentativas de reconexão */
  reconnectAttempts: number;
  /** Força reconexão manual */
  forceReconnect: () => Promise<void>;
  /** Sincroniza estado após reconexão */
  syncState: (entityId: string, entityType?: 'driver' | 'user' | 'vehicle' | 'device') => Promise<any>;
}

/**
 * Hook para monitorar estado de conexão e controlar reconexão
 * 
 * @example
 * ```tsx
 * function DriverApp() {
 *   const { isConnected, isReconnecting, forceReconnect } = useConnectionState();
 *   
 *   return (
 *     <div>
 *       {isReconnecting && <Banner>Reconectando...</Banner>}
 *       {!isConnected && <Button onClick={forceReconnect}>Reconectar</Button>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useConnectionState(): UseConnectionStateReturn {
  const [connectionState, setConnectionState] = useState<ConnectionState>(() =>
    trackingService.getConnectionState()
  );

  useEffect(() => {
    // Polling do estado de conexão
    const interval = setInterval(() => {
      const state = trackingService.getConnectionState();
      setConnectionState(state);
    }, 1000); // Atualizar a cada 1s

    return () => clearInterval(interval);
  }, []);

  const forceReconnect = async () => {
    await trackingService.forceReconnect();
    const state = trackingService.getConnectionState();
    setConnectionState(state);
  };

  const syncState = async (
    entityId: string,
    entityType: 'driver' | 'user' | 'vehicle' | 'device' = 'driver'
  ) => {
    return await trackingService.syncStateAfterReconnection(entityId, entityType);
  };

  return {
    connectionState,
    isConnected: connectionState.status === 'connected',
    isReconnecting: connectionState.status === 'reconnecting',
    isFailed: connectionState.status === 'failed',
    isStale: connectionState.isStale,
    reconnectAttempts: connectionState.reconnectAttempts,
    forceReconnect,
    syncState,
  };
}
