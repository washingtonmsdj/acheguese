/**
 * useBusinessStatus — Hook para verificar status de abertura
 *
 * SSOT: Consome BusinessHoursService do core/business
 */

import { useQuery } from '@tanstack/react-query';
import { BusinessHoursService } from '@/core/business';

export function useBusinessStatus(businessId: string) {
  const { data: status, isLoading, error } = useQuery({
    queryKey: ['business-status', businessId],
    queryFn: async () => {
      const result = await BusinessHoursService.getStatus(businessId);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    enabled: !!businessId,
    refetchInterval: 60000, // Refetch a cada 1 minuto
  });

  return {
    isOpen: status?.isOpen ?? false,
    nextOpening: status?.nextOpening ?? null,
    isLoading,
    error,
  };
}
