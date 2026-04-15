/**
 * useNeighborhoodsWithClassifieds - Hook para buscar apenas bairros com anúncios ativos
 * 
 * ✅ SSOT compliant:
 * - TanStack Query para cache
 * - Supabase para dados agregados
 * - Retorna apenas bairros com anúncios
 * - Inclui contagem de anúncios por bairro
 * - Escalável: query otimizada com agregação no backend
 */

import { useQuery } from "@tanstack/react-query";
import { ClassifiedsFacade } from "@/modules/classifieds/services";

export interface NeighborhoodWithCount {
  location_id: string;
  location_name: string;
  location_slug: string;
  count: number;
}

/**
 * Busca bairros que possuem anúncios ativos em uma cidade específica
 * Retorna apenas bairros com count > 0, ordenados por quantidade de anúncios
 */
export function useNeighborhoodsWithClassifieds(cityId: string | null) {
  return useQuery({
    queryKey: ["neighborhoods-with-classifieds", cityId],
    queryFn: async () => {
      if (!cityId) return [];
      return ClassifiedsFacade.queries.getNeighborhoodsWithClassifieds(cityId);
    },
    enabled: !!cityId,
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
  });
}
