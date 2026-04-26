/**
 * Hook para detalhe de negocio gastronomico alinhado ao territorio da rota.
 *
 * @version 2.0.0 - Atualizado para GastronomyFacade
 */

import { useQuery } from '@tanstack/react-query';
import { GastronomyFacade } from '../services';

export interface GastronomyDetailRouteInput {
  slug?: string;
  state?: string;
  city?: string;
  district?: string;
}

export function useGastronomyDetail(params?: GastronomyDetailRouteInput) {
  const { slug, state, city, district } = params ?? {};
  const hasTerritorialRoute = Boolean(slug && state && city && district);

  return useQuery({
    queryKey: ['gastronomy', 'detail', slug, state, city, district],
    queryFn: async () => {
      if (hasTerritorialRoute && slug && state && city && district) {
        return GastronomyFacade.queries.getGastronomyBusinessByTerritorySlug({
          slug,
          state,
          city,
          district,
        });
      }

      if (!slug) {
        return null;
      }

      return GastronomyFacade.queries.getGastronomyBusiness(slug);
    },
    enabled: Boolean(slug),
  });
}
