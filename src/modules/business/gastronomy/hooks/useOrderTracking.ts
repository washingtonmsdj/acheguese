/**
 * useOrderTracking — Hook para rastreamento GPS de pedidos
 * 
 * SSOT: Vincula orders (pedido) com ride_requests (rastreamento GPS)
 * 
 * Uso:
 *   const { rideRequest, hasTracking, isLoading } = useOrderTracking(orderId);
 */

import { useQuery } from '@tanstack/react-query';
import { OrderDeliveryLinkService } from '@/modules/mobility/delivery/services/OrderDeliveryLinkService';
import type { RideRequest } from '@/modules/mobility/types/types';

export interface UseOrderTrackingResult {
  rideRequest: RideRequest | null;
  hasTracking: boolean;
  isActive: boolean;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useOrderTracking(orderId: string): UseOrderTrackingResult {
  const {
    data: rideRequest,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['order-tracking', orderId],
    queryFn: () => OrderDeliveryLinkService.getRideRequestByOrderId(orderId),
    enabled: !!orderId,
    staleTime: 10000, // 10 segundos
    refetchInterval: (data) => {
      // Refetch automático se delivery está ativo
      if (!data) return false;
      
      const activeStatuses = [
        'requested',
        'searching_driver',
        'driver_assigned',
        'driver_accepted',
        'driver_arriving',
        'pickup_confirmed',
        'in_delivery',
      ];
      
      return activeStatuses.includes(data.status) ? 10000 : false;
    },
  });

  const hasTracking = !!rideRequest;
  
  const isActive = hasTracking && [
    'requested',
    'searching_driver',
    'driver_assigned',
    'driver_accepted',
    'driver_arriving',
    'pickup_confirmed',
    'in_delivery',
  ].includes(rideRequest.status);

  return {
    rideRequest: rideRequest || null,
    hasTracking,
    isActive,
    isLoading,
    error: error as Error | null,
    refetch,
  };
}
