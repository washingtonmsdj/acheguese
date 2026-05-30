/**
 * useTouristPoint - Hook publico de detalhe por slug + locationId.
 *
 * Rotas publicas de pontos turisticos nao aceitam UUID direto.
 */

import { useQuery } from '@tanstack/react-query';
import { TouristPointQueryService } from '../services/TouristPointQueryService';

export function useTouristPoint(locationId: string | undefined, slug: string | undefined) {
  return useQuery({
    queryKey: ['guide:tourist-point', locationId, slug],
    queryFn: () => TouristPointQueryService.getPublishedBySlug(locationId!, slug!),
    enabled: !!locationId && !!slug,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}
