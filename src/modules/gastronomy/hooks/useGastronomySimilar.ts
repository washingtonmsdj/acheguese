/**
 * useGastronomySimilar — Restaurantes similares (mesma cuisine_type)
 *
 * Reutiliza getSimilarBusinesses do SSOT de business + filtra por gastronomy_profiles.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase';
import { logger } from '@/shared/utils/logger';
import { isValidUUID } from '@/shared/utils/validation';

export interface SimilarGastronomyBusiness {
  business_data_id: string;
  name: string;
  slug: string;
  banner_url: string | null;
  rating: number;
  total_reviews: number;
  cuisine_type: string;
  delivery_enabled: boolean;
  geographic_path: string | null;
}

async function fetchSimilarGastronomyBusinesses(params: {
  businessDataId: string;
  cuisineType: string;
  limit?: number;
}): Promise<SimilarGastronomyBusiness[]> {
  const { businessDataId, cuisineType, limit = 5 } = params;

  try {
    // Buscar perfis gastronômicos da mesma cuisine, excluindo o atual
    const { data: profiles, error: profilesError } = await supabase
      .from('gastronomy_profiles')
      .select('business_id, cuisine_type, delivery_enabled')
      .eq('cuisine_type', cuisineType)
      .eq('status', 'active')
      .neq('business_id', businessDataId)
      .limit(limit);

    if (profilesError || !profiles?.length) return [];

    const businessIds = profiles.map((p) => p.business_id);

    // Buscar dados dos negócios
    const { data: businesses, error: bizError } = await supabase
      .from('business_data')
      .select(`
        id,
        business_name,
        slug,
        banner_url,
        rating,
        total_reviews,
        location:locations!location_id(geographic_path)
      `)
      .in('id', businessIds)
      .eq('status', 'active');

    if (bizError || !businesses?.length) return [];

    // Montar mapa de perfis
    const profilesMap = new Map(profiles.map((p) => [p.business_id, p]));

    return businesses.map((b) => ({
      business_data_id: b.id as string,
      name: (b.business_name as string) || '',
      slug: (b.slug as string) || '',
      banner_url: (b.banner_url as string | null) || null,
      rating: (b.rating as number) || 0,
      total_reviews: (b.total_reviews as number) || 0,
      cuisine_type: profilesMap.get(b.id as string)?.cuisine_type || cuisineType,
      delivery_enabled: profilesMap.get(b.id as string)?.delivery_enabled || false,
      geographic_path: (b.location as { geographic_path?: string } | null)?.geographic_path || null,
    }));
  } catch (error) {
    logger.error('[useGastronomySimilar] Error:', error);
    return [];
  }
}

export function useGastronomySimilar(params: {
  businessDataId: string;
  cuisineType: string;
  limit?: number;
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: [
      'gastronomy',
      'similar',
      params.businessDataId,
      params.cuisineType,
    ],
    queryFn: () => fetchSimilarGastronomyBusinesses(params),
    // Só executa com UUID válido (não mock)
    enabled:
      params.enabled !== false &&
      isValidUUID(params.businessDataId) &&
      !!params.cuisineType,
    staleTime: 10 * 60 * 1000,
  });
}
