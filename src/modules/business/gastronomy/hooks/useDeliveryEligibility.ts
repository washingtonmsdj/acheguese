/**
 * useDeliveryEligibility — Hook para verificar elegibilidade de entrega
 *
 * SSOT: Consome DeliveryAreaService do core/delivery
 */

import { useQuery } from '@tanstack/react-query';
import { DeliveryAreaService } from '@/modules/business/gastronomy/services/DeliveryAreaService';

interface UseDeliveryEligibilityParams {
  businessId: string;
  neighborhood: string;
  city: string;
  state: string;
  orderValue?: number;
  enabled?: boolean;
}

export function useDeliveryEligibility({
  businessId,
  neighborhood,
  city,
  state,
  orderValue = 0,
  enabled = true,
}: UseDeliveryEligibilityParams) {
  const { data: eligibility, isLoading, error } = useQuery({
    queryKey: ['delivery-eligibility', businessId, neighborhood, city, state, orderValue],
    queryFn: async () => {
      const result = await DeliveryAreaService.checkEligibility(
        businessId,
        neighborhood,
        city,
        state,
        orderValue
      );
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    enabled: enabled && !!businessId && !!neighborhood && !!city && !!state,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  return {
    eligibility,
    isLoading,
    error,
    isEligible: eligibility?.is_eligible ?? false,
    deliveryFee: eligibility?.delivery_fee ?? null,
    minimumOrderValue: eligibility?.minimum_order_value ?? null,
    estimatedTime: eligibility?.estimated_time_min ?? null,
    message: eligibility?.message ?? '',
  };
}

