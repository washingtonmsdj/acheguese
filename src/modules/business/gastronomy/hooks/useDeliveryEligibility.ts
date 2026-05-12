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
  const normalizedNeighborhood = neighborhood.trim();
  const normalizedCity = city.trim();
  const normalizedState = state.trim();
  const shouldFetch =
    enabled &&
    !!businessId &&
    normalizedNeighborhood.length > 0 &&
    normalizedCity.length > 0 &&
    normalizedState.length > 0;

  const { data: eligibility, isLoading, error } = useQuery({
    queryKey: [
      'delivery-eligibility',
      businessId,
      normalizedNeighborhood,
      normalizedCity,
      normalizedState,
      orderValue,
    ],
    queryFn: async () => {
      const result = await DeliveryAreaService.checkEligibility(
        businessId,
        normalizedNeighborhood,
        normalizedCity,
        normalizedState,
        orderValue
      );
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    enabled: shouldFetch,
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

