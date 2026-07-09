/**
 * useRideRealtime - Hook para atualizacoes em tempo real de corridas
 *
 * Permite passageiro e motorista receberem notificacoes de mudanca de estado
 * sem precisar fazer polling ou refresh manual.
 */
import { logger } from '@/shared/utils/logger';
import { useEffect, useRef, useState } from 'react';
import {
  realtimeService,
  type RealtimeSubscription,
} from '@/core/realtime/services/RealtimeService';
import { DB_TABLES, REALTIME_CHANNELS } from '@/core/mobility/constants';

export interface RideRealtimeEvent {
  type:
    | 'state_change'
    | 'driver_assigned'
    | 'driver_accepted'
    | 'in_progress'
    | 'in_delivery'
    | 'completed'
    | 'delivered'
    | 'expired'
    | 'cancelled';
  rideId: string;
  newState?: string;
  driverProfileId?: string;
  timestamp: string;
}

export interface UseRideRealtimeOptions {
  rideId?: string;
  userType: 'passenger' | 'driver';
  userId?: string;
  onEvent?: (event: RideRealtimeEvent) => void;
  enabled?: boolean;
}

interface RideRealtimeRow {
  id?: string;
  status?: string | null;
  driver_profile_id?: string | null;
}

interface PostgresUpdatePayload<T> {
  new?: T;
  old?: T;
}

export function useRideRealtime(options: UseRideRealtimeOptions) {
  const { rideId, userType, userId, onEvent, enabled = true } = options;

  const [lastEvent, setLastEvent] = useState<RideRealtimeEvent | null>(null);
  const subscriptionRef = useRef<RealtimeSubscription | null>(null);
  const onEventRef = useRef<UseRideRealtimeOptions['onEvent']>(onEvent);

  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    if (!enabled || !userId) {
      return;
    }

    const subscriptionId = rideId
      ? `ride-realtime-${userId}-${rideId}`
      : `ride-realtime-${userId}`;

    const subscription = realtimeService.subscribeToPostgresChanges({
      subscriptionId,
      channelName: REALTIME_CHANNELS.rideRealtime(userId),
      table: DB_TABLES.RIDE_REQUESTS,
      event: 'UPDATE',
      filter: rideId ? `id=eq.${rideId}` : undefined,
      onChange: (payload) => {
        logger.info('Ride realtime event:', payload);

        const typedPayload = payload as PostgresUpdatePayload<RideRealtimeRow>;
        const newData = typedPayload.new || {};
        const oldData = typedPayload.old || {};

        const targetRideId = newData.id || oldData.id;
        if (!targetRideId) {
          logger.warn('Ride realtime payload without ride id', { userId, rideId, payload });
          return;
        }

        let eventType: RideRealtimeEvent['type'] = 'state_change';
        if (newData.status !== oldData.status) {
          if (newData.status === 'driver_assigned') {
            eventType = 'driver_assigned';
          } else if (newData.status === 'driver_accepted') {
            eventType = 'driver_accepted';
          } else if (newData.status === 'in_progress') {
            eventType = 'in_progress';
          } else if (newData.status === 'in_delivery') {
            eventType = 'in_delivery';
          } else if (newData.status === 'delivered') {
            eventType = 'delivered';
          } else if (newData.status === 'completed') {
            eventType = 'completed';
          } else if (newData.status === 'expired') {
            eventType = 'expired';
          } else if (newData.status?.includes('cancelled')) {
            eventType = 'cancelled';
          }
        }

        const eventData: RideRealtimeEvent = {
          type: eventType,
          rideId: targetRideId,
          newState: newData.status || undefined,
          driverProfileId: newData.driver_profile_id || undefined,
          timestamp: new Date().toISOString(),
        };

        setLastEvent(eventData);
        onEventRef.current?.(eventData);
      },
    });

    subscriptionRef.current = subscription;

    logger.info('Ride realtime subscribed', { userId, userType, rideId });

    return () => {
      subscription.unsubscribe();
      subscriptionRef.current = null;
      logger.info('Ride realtime unsubscribed', { userId, userType });
    };
  }, [enabled, userId, rideId, userType]);

  return {
    lastEvent,
    isConnected: subscriptionRef.current !== null,
  };
}
