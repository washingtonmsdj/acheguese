/**
 * Hook para item do cardápio
 *
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
