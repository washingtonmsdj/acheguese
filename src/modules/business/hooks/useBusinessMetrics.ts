import { useQuery } from "@tanstack/react-query";
import { BusinessService } from "@/core/business/services/BusinessService";

export function useBusinessMetrics(businessId: string | undefined) {
  return useQuery({
    queryKey: ["business-metrics", businessId],
    queryFn: () => BusinessService.getBusinessMetrics(businessId!),
    enabled: !!businessId,
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 1,
  });
}
