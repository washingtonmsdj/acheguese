/**
 * useLocationOptions
 *
 * Hook autorizado para leitura de cidades e bairros canônicos.
 * Usa LocationService (camada de domínio) — sem query direta no componente.
 */

import { useQuery } from '@tanstack/react-query';
import { createLocationRepository } from '@/core/location/repositories/createLocationRepository';
import { LocationStatus, type Location } from '@/core/location/types';

const repo = createLocationRepository();

/** Busca todas as cidades ativas */
export function useCities() {
  return useQuery<Location[]>({
    queryKey: ['locations', 'cities'],
    queryFn: async () => {
      const result = await repo.findAll();
      return result.filter((l) => l.type === 'city' && l.status === LocationStatus.ACTIVE);
    },
    staleTime: 5 * 60 * 1000,
  });
}

/** Busca bairros ativos de uma cidade */
export function useDistricts(cityId: string | undefined) {
  return useQuery<Location[]>({
    queryKey: ['locations', 'districts', cityId],
    queryFn: async () => {
      if (!cityId) return [];
      const result = await repo.findChildren(cityId, {
        type: 'district',
        status: LocationStatus.ACTIVE,
        page: 1,
        page_size: 500,
      });
      return result.locations;
    },
    enabled: !!cityId,
    staleTime: 5 * 60 * 1000,
  });
}
