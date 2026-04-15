/**
 * useTerritorialGroups
 * 
 * Hook para buscar todos os grupos territoriais.
 * Usado pelo TerritorySelector.
 */

import { useQuery } from '@tanstack/react-query';
import { createTerritorialGroupRepository } from '../repositories/createTerritorialGroupRepository';

export function useTerritorialGroups() {
  return useQuery({
    queryKey: ['territorial-groups', 'all'],
    queryFn: async () => {
      const repo = createTerritorialGroupRepository();
      return repo.listAll();
    },
    staleTime: 10 * 60 * 1000, // 10 min
  });
}
