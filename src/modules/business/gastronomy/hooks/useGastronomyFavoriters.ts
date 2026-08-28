/**
 * useGastronomyFavoriters — Quem favoritou este restaurante
 *
 * Reutiliza user_favorite_businesses (tabela criada na migration 20260412000002).
 * Expõe contagem para o dono do estabelecimento.
 */

import { useQuery } from '@tanstack/react-query';
import { FavoritesQueryService } from '@/core/business/services/gastronomy.favorites.queries';
import { isValidUUID } from '@/shared/utils/validation';

async function fetchFavoritersCount(businessDataId: string): Promise<number> {
  return FavoritesQueryService.getBusinessFavoritesCount(businessDataId);
}

export function useGastronomyFavoritersCount(params: {
  businessDataId: string;
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: ['gastronomy', 'favoriters', 'count', params.businessDataId],
    queryFn: () => fetchFavoritersCount(params.businessDataId),
    enabled: params.enabled !== false && isValidUUID(params.businessDataId),
    staleTime: 5 * 60 * 1000,
  });
}
