/**
 * useTracking - Hook para tracking de posição em tempo real
 *
 * SSOT para rastreio de posição.
 * Usa TrackingService internamente.
 *
 * Padrão: Banco → Service → Hook → Component
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { trackingService } from '../services/TrackingService';
import type {
  TrackingPosition,
  PresenceStatus,
  TrackingSubscription,
} from '../types';

interface UseTrackingOptions {
  entityId: string;
  entityType?: 'driver' | 'user' | 'vehicle' | 'device';
  enabled?: boolean;
  updateInterval?: number;
  onPositionChange?: (position: TrackingPosition) => void;
}

interface UseTrackingResult {
  position: TrackingPosition | null;
  status: PresenceStatus;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  updatePosition: (position: Omit<TrackingPosition, 'timestamp'>) => Promise<void>;
  updateStatus: (status: PresenceStatus) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useTracking(options: UseTrackingOptions): UseTrackingResult {
  const {
    entityId,
    entityType = 'driver',
    enabled = true,
    onPositionChange,
  } = options;

  const [position, setPosition] = useState<TrackingPosition | null>(null);
  const [status, setStatus] = useState<PresenceStatus>('unknown');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const subscriptionRef = useRef<TrackingSubscription | null>(null);

  // Carregar posição inicial e subscrever a atualizações
  useEffect(() => {
    if (!entityId || !enabled) {
      setIsLoading(false);
      return;
    }

    const init = async () => {
      try {
        // Carregar posição atual
        const currentPosition = await trackingService.getCurrentPosition(
          entityId,
          entityType
        );
        if (currentPosition) {
          setPosition(currentPosition);
          setIsConnected(true);
        }

        // Carregar status de presença
        const currentStatus = await trackingService.getPresence(entityId, entityType);
        setStatus(currentStatus);

        // Subscrever a atualizações
        subscriptionRef.current = trackingService.subscribeToPosition(
          entityId,
          (newPosition) => {
            setPosition(newPosition);
            setIsConnected(true);
            onPositionChange?.(newPosition);
          },
          entityType
        );

        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar tracking');
        setIsLoading(false);
      }
    };

    init();

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
  }, [entityId, entityType, enabled, onPositionChange]);

  // Atualizar posição
  const updatePosition = useCallback(
    async (newPosition: Omit<TrackingPosition, 'timestamp'>) => {
      try {
        await trackingService.updatePosition(entityId, newPosition, entityType);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao atualizar posição');
        throw err;
      }
    },
    [entityId, entityType]
  );

  // Atualizar status
  const updateStatus = useCallback(
    async (newStatus: PresenceStatus) => {
      try {
        await trackingService.updatePresence(entityId, newStatus, entityType);
        setStatus(newStatus);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao atualizar status');
        throw err;
      }
    },
    [entityId, entityType]
  );

  // Refetch manual
  const refetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const currentPosition = await trackingService.getCurrentPosition(
        entityId,
        entityType
      );
      if (currentPosition) {
        setPosition(currentPosition);
      }
      const currentStatus = await trackingService.getPresence(entityId, entityType);
      setStatus(currentStatus);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao recarregar');
    } finally {
      setIsLoading(false);
    }
  }, [entityId, entityType]);

  return {
    position,
    status,
    isConnected,
    isLoading,
    error,
    updatePosition,
    updateStatus,
    refetch,
  };
}