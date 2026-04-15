/**
 * useGastronomyFavoriters — Quem favoritou este restaurante
 *
 * Reutiliza user_favorite_businesses (tabela criada na migration 20260412000002).
 * Expõe contagem para o dono do estabelecimento.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase';
import { logger } from '@/shared/utils/logger';
import { isValidUUID } from '@/shared/utils/validation';

async function fetchFavoritersCount(businessDataId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('user_favorite_businesses')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', businessDataId);

    if (error) {
      logger.error('[useGastronomyFavoriters] Error:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    logger.error('[useGastronomyFavoriters] Unexpected error:', error);
    return 0;
  }
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
