/**
 * useOrderStats — Hook para buscar estatísticas de pedidos
 *
 * SSOT: Consome OrderService do core/orders
 */

import { useQuery } from '@tanstack/react-query';
import { OrderService } from '@/core/orders';

export function useOrderStats(
  businessId: string,
  dateFrom?: string,
  dateTo?: string
) {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['order-stats', businessId, dateFrom, dateTo],
    queryFn: async () => {
      const result = await OrderService.getOrderStats(businessId, dateFrom, dateTo);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    enabled: !!businessId,
    staleTime: 60000, // 1 minuto
  });

  return {
    stats,
    isLoading,
    error,
    totalOrders: stats?.total_orders ?? 0,
    pendingOrders: stats?.pending_orders ?? 0,
    completedOrders: stats?.completed_orders ?? 0,
    cancelledOrders: stats?.cancelled_orders ?? 0,
    totalRevenue: stats?.total_revenue ?? 0,
    averageOrderValue: stats?.average_order_value ?? 0,
  };
}
