import { useQuery } from "@tanstack/react-query";
import { BusinessService } from "@/core/business/services/BusinessService";
import type { Business } from "@/core/business/types";

interface UseBusinessResult {
  business: Business | null;
  isLoading: boolean;
  error: Error | null;
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * SSOT hook for fetching a business by UUID or slug.
 */
export function useBusiness(idOrSlug: string): UseBusinessResult {
  const query = useQuery({
    queryKey: ["business", idOrSlug],
    queryFn: async () => {
      if (!idOrSlug) {
        throw new Error("ID ou slug é obrigatório");
      }

      if (UUID_PATTERN.test(idOrSlug)) {
        return BusinessService.getBusinessById(idOrSlug);
      }

      const slugData = await BusinessService.getBusinessBySlug(idOrSlug);
      if (!slugData) {
        throw new Error("Empresa não encontrada");
      }

      return BusinessService.getBusinessById(slugData.id);
    },
    enabled: Boolean(idOrSlug),
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  const error = query.error
    ? query.error instanceof Error
      ? query.error
      : new Error(String(query.error))
    : null;

  return {
    business: query.data || null,
    isLoading: query.isLoading,
    error,
  };
}
