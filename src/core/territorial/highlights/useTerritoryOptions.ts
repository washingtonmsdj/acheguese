/**
 * useTerritoryOptions
 *
 * Carrega dinamicamente os territórios disponíveis para seleção no admin:
 *   - TerritorialGroups ativos (tipo 'group')
 *   - Districts ativos da cidade âncora (tipo 'location')
 *
 * Ordenação:
 *   - Grupos primeiro, depois bairros
 *   - Dentro de cada categoria: ordem alfabética por nome
 *
 * Nada hardcoded — usa createTerritorialGroupRepository e createLocationRepository.
 */

import { useQuery } from '@tanstack/react-query';
import { createTerritorialGroupRepository } from '@/core/location/repositories/createTerritorialGroupRepository';
import { createLocationRepository } from '@/core/location/repositories/createLocationRepository';
import { LocationStatus, LocationType } from '@/core/location/types';
import type { HighlightTerritoryType } from './types';

export interface TerritoryOption {
  ref_id: string;
  label: string;
  type: HighlightTerritoryType;
}

/**
 * Carrega grupos e bairros disponíveis para o seletor de território.
 *
 * @param anchorCityId - ID da cidade âncora para filtrar districts.
 *   Padrão: 'loc-salvador' (cidade de lançamento).
 *   Quando Supabase estiver ativo, passar o ID real da cidade.
 */
export function useTerritoryOptions(anchorCityId = 'loc-salvador') {
  return useQuery({
    queryKey: ['territory-options', anchorCityId],
    queryFn: async (): Promise<TerritoryOption[]> => {
      const groupRepo    = createTerritorialGroupRepository();
      const locationRepo = createLocationRepository();

      // Carrega grupos e districts em paralelo
      const [groupsResult, districtsResult] = await Promise.all([
        // Grupos: busca todos os grupos da cidade âncora via findGroupsContainingLocation
        // Como não há listAll por cidade, usamos findWithMembers do grupo conhecido.
        // Para suporte multi-grupo futuro, o repositório precisará de listByCityId.
        // Por ora: busca grupos que contêm qualquer district da cidade.
        locationRepo.findChildren(anchorCityId, { type: LocationType.DISTRICT, status: LocationStatus.ACTIVE }),
        locationRepo.findChildren(anchorCityId, { type: LocationType.DISTRICT, status: LocationStatus.ACTIVE }),
      ]);

      // Districts ativos da cidade
      const districts = districtsResult.locations;

      // Grupos: resolve via findGroupsContainingLocation para cada district
      // Deduplica por group.id
      const groupMap = new Map<string, TerritoryOption>();
      await Promise.all(
        districts.map(async (district) => {
          const groups = await groupRepo.findGroupsContainingLocation(district.id);
          for (const g of groups) {
            if (g.status === LocationStatus.ACTIVE && !groupMap.has(g.id)) {
              groupMap.set(g.id, {
                ref_id: g.id,
                label: g.name,
                type: 'group',
              });
            }
          }
        }),
      );

      // Monta lista: grupos primeiro (alfabético), depois bairros (alfabético)
      const groupOptions = Array.from(groupMap.values()).sort((a, b) =>
        a.label.localeCompare(b.label, 'pt-BR'),
      );

      const districtOptions: TerritoryOption[] = districts
        .map((d) => ({ ref_id: d.id, label: d.name, type: 'location' as const }))
        .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'));

      return [...groupOptions, ...districtOptions];
    },
    staleTime: 10 * 60 * 1000, // territórios mudam raramente
    gcTime: 30 * 60 * 1000,
  });
}
