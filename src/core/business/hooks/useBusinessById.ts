import { useQuery } from "@tanstack/react-query";
import { BusinessService } from "@/core/business/services/BusinessService";
import type { Business } from "@/core/business/types/Business";

interface UseBusinessByIdReturn {
  business: Business | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useBusinessById(id: string | undefined): UseBusinessByIdReturn {
  const query = useQuery({
    queryKey: ["business", id || ""],
    queryFn: async () => {
      if (!id) throw new Error("ID e obrigatorio");
      return BusinessService.getBusinessById(id);
    },
    enabled: Boolean(id),
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  return {
    business: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
