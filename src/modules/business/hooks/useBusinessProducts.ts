/**
 * 🏆 USE BUSINESS PRODUCTS - Hook SSOT para Produtos de Empresas
 *
 * ✅ Usa exclusivamente BusinessService
 * ✅ Tipagem completa com Product[]
 * ✅ Cache via React Query
 * ✅ Error handling
 *
 */

import { useQuery } from "@tanstack/react-query";
import { BusinessService } from "@/core/business/services/BusinessService";
import type { Product } from "@/core/business/types";

interface UseBusinessProductsReturn {
  products: Product[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useBusinessProducts(
  businessId: string | undefined,
): UseBusinessProductsReturn {
  const query = useQuery({
    queryKey: ["business", "products", businessId || ""],
    queryFn: async () => {
      if (!businessId) return [];
      return await BusinessService.getProducts(businessId);
    },
    enabled: !!businessId,
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 2,
  });

  return {
    products: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
