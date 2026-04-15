/**
 * Hook para item do cardápio
 *
 * @version 2.0.0 - Atualizado para GastronomyFacade
 */

import { useQuery } from '@tanstack/react-query';
import { GastronomyFacade } from '../services';

export function useMenuItem(itemId?: string) {
  return useQuery({
    queryKey: ['menu', 'item', itemId],
    queryFn: () => GastronomyFacade.queries.getMenuItem(itemId!),
    enabled: !!itemId,
  });
}
