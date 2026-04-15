/**
 * useLocations
 * 
 * Hook para buscar todas as locations (cidades e bairros).
 * Usado pelo TerritorySelector.
 */

import { useQuery } from '@tanstack/react-query';
import { createLocationRepository } from '../repositories/createLocationRepository';

export function useLocations() {
  return useQuery({
    queryKey: ['locations', 'all'],
    queryFn: async () => {
      const repo = createLocationRepository();
      return repo.findAll();
    },
    staleTime: 10 * 60 * 1000, // 10 min
  });
}
