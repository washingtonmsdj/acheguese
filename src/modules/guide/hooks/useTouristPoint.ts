/**
 * useTouristPoint — Hook público de detalhe por slug + locationId ou por ID
 *
 * Orquestra estado de loading/error/data.
 * Aceita tanto slug quanto UUID direto.
 */

import { useQuery } from '@tanstack/react-query';
import { TouristPointQueryService } from '../services/TouristPointQueryService';

export function useTouristPoint(locationId: string | undefined, slugOrId: string | undefined) {
  // Detectar se é UUID
  const isUUID = slugOrId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);
  
  return useQuery({
    queryKey: ['guide:tourist-point', locationId, slugOrId, isUUID],
    queryFn: () => {
      if (isUUID) {
        // Buscar por ID direto
        return TouristPointQueryService.getById(slugOrId!);
      }
      // Buscar por slug + locationId
      return TouristPointQueryService.getPublishedBySlug(locationId!, slugOrId!);
    },
    enabled: isUUID ? !!slugOrId : (!!locationId && !!slugOrId),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}
