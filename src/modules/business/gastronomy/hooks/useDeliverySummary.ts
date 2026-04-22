/**
 * useDeliverySummary — Hook para buscar resumo das áreas de entrega
 *
 * SSOT: Consome DeliveryAreaService do core/delivery
 */

import { useQuery } from '@tanstack/react-query';
import { DeliveryAreaService } from '@/modules/business/gastronomy/services/DeliveryAreaService';

export function useDeliverySummary(businessId: string) {
  const { data: summary, isLoading, error } = useQuery({
    queryKey: ['delivery-summary', businessId],
    queryFn: async () => {
      const result = await DeliveryAreaService.getSummary(businessId);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    enabled: !!businessId,
  });

  return {
    summary,
    isLoading,
    error,
    totalAreas: summary?.total_areas ?? 0,
    totalNeighborhoods: summary?.total_neighborhoods ?? 0,
    activeAreas: summary?.active_areas ?? 0,
    minDeliveryFee: summary?.min_delivery_fee ?? null,
    maxDeliveryFee: summary?.max_delivery_fee ?? null,
    avgEstimatedTime: summary?.avg_estimated_time ?? null,
  };
}

