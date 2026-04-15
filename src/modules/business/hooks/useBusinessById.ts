/**
 * 🏆 USE BUSINESS BY ID - Hook SSOT para Buscar Empresa por ID
 *
 * ✅ Usa exclusivamente BusinessService
 * ✅ Cache via React Query
 * ✅ queryKey: ['business', id]
 */

import { useQuery } from "@tanstack/react-query";
import { BusinessService } from "@/core/business/services/BusinessService";
import type { Business } from "@/modules/business/types";

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
      if (!id) throw new Error("ID é obrigatório");
      return await BusinessService.getBusinessById(id);
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutos
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
