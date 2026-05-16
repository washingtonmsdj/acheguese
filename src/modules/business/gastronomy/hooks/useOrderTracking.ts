/**
 * useOrderTracking — Hook para rastreamento GPS de pedidos
 *
 * SSOT: Vincula orders (pedido) com ride_requests (rastreamento GPS)
 *
 * Uso:
 *   const { rideRequest, hasTracking, isLoading } = useOrderTracking(orderId);
 */

import { useEffect, useMemo, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { GastronomyOrderRealtimeService } from '@/modules/business/gastronomy/services/GastronomyOrderRealtimeService';
import { OrderDeliveryLinkService } from '@/modules/mobility/delivery/services/OrderDeliveryLinkService';
import type { RideRequest } from '@/modules/mobility/types/types';

export interface UseOrderTrackingResult {
  rideRequest: RideRequest | null;
  hasTracking: boolean;
  isActive: boolean;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<unknown>;
}

const ACTIVE_TRACKING_STATUSES = [
  'requested',
  'searching_driver',
  'driver_assigned',
  'driver_accepted',
  'driver_arriving',
  'pickup_confirmed',
  'in_delivery',
] as const;

function isActiveTrackingStatus(status: string | null | undefined): boolean {
  return ACTIVE_TRACKING_STATUSES.includes(
    status as (typeof ACTIVE_TRACKING_STATUSES)[number],
  );
}

export function useOrderTracking(orderId: string): UseOrderTrackingResult {
  const queryClient = useQueryClient();
  const queryKey = useMemo(() => ['order-tracking', orderId] as const, [orderId]);
  const invalidateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    data: rideRequest,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: () => OrderDeliveryLinkService.getRideRequestByOrderId(orderId),
    enabled: !!orderId,
    staleTime: 10000,
    refetchInterval: (query) => {
      const data = query.state.data;
      // Fallback: enquanto nao houver vinculo, manter verificacao leve.
      if (!data) return 15000;
      return isActiveTrackingStatus(data.status) ? 15000 : false;
    },
  });

  useEffect(() => {
    if (!orderId) return;

    const channel = GastronomyOrderRealtimeService.subscribeOrderTracking(orderId, (payload) => {
      const newSourceId =
        payload.new && typeof payload.new === 'object' && 'source_id' in payload.new
          ? String(payload.new.source_id ?? '')
          : '';
      const oldSourceId =
        payload.old && typeof payload.old === 'object' && 'source_id' in payload.old
          ? String(payload.old.source_id ?? '')
          : '';
      const newSourceType =
        payload.new && typeof payload.new === 'object' && 'source_type' in payload.new
          ? String(payload.new.source_type ?? '')
          : '';
      const oldSourceType =
        payload.old && typeof payload.old === 'object' && 'source_type' in payload.old
          ? String(payload.old.source_type ?? '')
          : '';

      const isGastronomyContext =
        newSourceType === 'gastronomy' || oldSourceType === 'gastronomy';

      if ((newSourceId === orderId || oldSourceId === orderId) && isGastronomyContext) {
        if (!invalidateTimerRef.current) {
          invalidateTimerRef.current = setTimeout(() => {
            invalidateTimerRef.current = null;
            void queryClient.invalidateQueries({ queryKey });
          }, 250);
        }
      }
    });

    return () => {
      if (invalidateTimerRef.current) {
        clearTimeout(invalidateTimerRef.current);
        invalidateTimerRef.current = null;
      }
      void GastronomyOrderRealtimeService.removeChannel(channel);
    };
  }, [orderId, queryClient, queryKey]);

  const hasTracking = !!rideRequest;
  const isActive = hasTracking && isActiveTrackingStatus(rideRequest.status);

  return {
    rideRequest: rideRequest || null,
    hasTracking,
    isActive,
    isLoading,
    error: error as Error | null,
    refetch,
  };
}
