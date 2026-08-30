import { useQuery } from '@tanstack/react-query';
import * as educationQueries from '@/core/education/services/education.queries';

export interface EducationDetailRouteInput {
  slug?: string;
  state?: string;
  city?: string;
  district?: string;
}

export function useEducationDetail(params?: EducationDetailRouteInput) {
  const { slug, state, city, district } = params ?? {};
  const hasTerritorialRoute = Boolean(slug && state && city && district);

  return useQuery({
    queryKey: ['education', 'detail', slug, state, city, district],
    queryFn: async () => {
      if (!slug) return null;
      
      // Busca territorial completa
      if (hasTerritorialRoute && state && city && district) {
        return educationQueries.getEducationProfileByTerritory({
          state,
          city,
          district,
          slug,
        });
      }
      
      // Fallback: busca por slug apenas (se necessário no futuro)
      return null;
    },
    enabled: Boolean(slug) && hasTerritorialRoute,
  });
}
