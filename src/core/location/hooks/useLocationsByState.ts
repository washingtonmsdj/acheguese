/**
 * useLocationsByState
 * 
 * Hook para buscar cidades de um estado específico.
 * Escalável: carrega sob demanda ao expandir um estado.
 */

import { useQuery } from '@tanstack/react-query';
import { createLocationRepository } from '../repositories/createLocationRepository';
import { LocationType } from '../types';

export function useLocationsByState(stateCode: string | null) {
  return useQuery({
    queryKey: ['locations', 'by-state', stateCode],
    queryFn: async () => {
      if (!stateCode) return [];
      const repo = createLocationRepository();
      const all = await repo.findAll();
      // Filtra cidades cujo geographic_path contém o estado
      return all.filter(loc => {
        if (loc.type !== LocationType.CITY || loc.status !== 'active') return false;
        const parts = loc.geographic_path.split('/').filter(Boolean);
        // geographic_path: /br/ba/salvador → parts[1] = 'ba'
        return parts[1] === stateCode.toLowerCase();
      });
    },
    enabled: !!stateCode,
    staleTime: 10 * 60 * 1000,
  });
}

export function useDistrictsByCity(cityId: string | null) {
  return useQuery({
    queryKey: ['locations', 'districts-by-city', cityId],
    queryFn: async () => {
      if (!cityId) return [];
      const repo = createLocationRepository();
      const all = await repo.findAll();
      const neighborhoods = all.filter(
        loc => loc.type === LocationType.NEIGHBORHOOD && loc.parent_id === cityId && loc.status === 'active',
      );

      if (neighborhoods.length > 0) return neighborhoods;

      return all.filter(
        loc => loc.type === LocationType.DISTRICT && loc.parent_id === cityId && loc.status === 'active',
      );
    },
    enabled: !!cityId,
    staleTime: 10 * 60 * 1000,
  });
}
