import { useQuery } from "@tanstack/react-query";
import { TrendingTopic } from "@/core/community/types";
import { useUserTerritory } from "@/core/location/hooks/useUserTerritory";

/**
 * Hook para tendÃªncias do bairro do usuÃ¡rio.
 *
 * Usa o location_id canÃ´nico (UUID) como chave de cache â€” nunca string de nome.
 * TODO: Implementar query real baseada em hashtags/menÃ§Ãµes dos posts por location_id.
 */
export function useTrendingTopics(limit: number = 3) {
  const { homeDistrict, hasHome } = useUserTerritory();

  return useQuery({
    queryKey: ["trending-topics", homeDistrict?.id ?? null, limit],
    queryFn: async (): Promise<TrendingTopic[]> => {
      if (!homeDistrict?.id) return [];

      // TODO: Substituir por serviÃ§o SSOT de trends por location_id.

      return [];
    },
    enabled: hasHome && !!homeDistrict?.id,
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
}

