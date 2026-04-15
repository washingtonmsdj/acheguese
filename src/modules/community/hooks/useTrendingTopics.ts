import { useQuery } from "@tanstack/react-query";
import { TrendingTopic } from "@/modules/community/types";
import { useUserTerritory } from "@/core/location/hooks/useUserTerritory";

/**
 * Hook para tendências do bairro do usuário.
 *
 * Usa o location_id canônico (UUID) como chave de cache — nunca string de nome.
 * TODO: Implementar query real baseada em hashtags/menções dos posts por location_id.
 */
export function useTrendingTopics(limit: number = 3) {
  const { homeDistrict, hasHome } = useUserTerritory();

  return useQuery({
    queryKey: ["trending-topics", homeDistrict?.id ?? null, limit],
    queryFn: async (): Promise<TrendingTopic[]> => {
      if (!homeDistrict?.id) return [];

      // TODO: Substituir por serviço SSOT de trends por location_id.

      return [];
    },
    enabled: hasHome && !!homeDistrict?.id,
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
}
