/**
 * useSelectorTerritories
 *
 * Read-model de UI para os territórios exibidos no seletor principal.
 * Compõe os owners canônicos de Location + Territorial sem recriar
 * persistência ou autoridade paralela.
 */

import { useQuery } from '@tanstack/react-query';
import { createLocationRepository } from '@/core/location/repositories/createLocationRepository';
import { territorialGroupService } from '@/core/territorial';
import { LocationStatus, LocationType } from '@/core/location/types';
import {
  isTerritoryPubliclyNavigable,
  isTerritorySelectorActive,
} from '@/core/routing/utils/territoryVisibility';

export interface SelectorTerritory {
  kind: 'location' | 'group';
  id: string;
  slug: string;
  name: string;
  path: string;
  description?: string;
  type?: LocationType;
}

async function listSelectorTerritories(): Promise<SelectorTerritory[]> {
  const locationRepository = createLocationRepository();
  const [allLocations, allGroups] = await Promise.all([
    locationRepository.findAll(),
    territorialGroupService.listAllGroups(),
  ]);

  const locationResults: SelectorTerritory[] = allLocations
    .filter(
      (location) =>
        location.status === LocationStatus.ACTIVE &&
        (location.type === LocationType.CITY ||
          location.type === LocationType.DISTRICT ||
          location.type === LocationType.NEIGHBORHOOD) &&
        isTerritorySelectorActive(location.metadata) &&
        isTerritoryPubliclyNavigable(location.metadata),
    )
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((location) => ({
      kind: 'location' as const,
      id: location.id,
      slug: location.slug,
      name: location.name,
      path: location.geographic_path.replace(/^\/br/, ''),
      description: location.type === LocationType.CITY ? 'Cidade' : location.full_name,
      type: location.type,
    }));

  const locationById = new Map(allLocations.map((location) => [location.id, location]));
  const groupResults: SelectorTerritory[] = allGroups
    .filter(
      (group) =>
        group.status === 'active' &&
        isTerritorySelectorActive(group.metadata) &&
        isTerritoryPubliclyNavigable(group.metadata),
    )
    .map((group) => {
      const anchorCity = locationById.get(group.anchor_city_id);
      const anchorPath = anchorCity?.geographic_path.replace(/^\/br/, '') ?? '';

      return {
        kind: 'group' as const,
        id: group.id,
        slug: group.slug,
        name: group.name,
        path: anchorPath ? `${anchorPath}/${group.slug}` : `/${group.slug}`,
        description: group.description ?? 'Grupo territorial',
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  return [...locationResults, ...groupResults];
}

export function useSelectorTerritories() {
  return useQuery<SelectorTerritory[]>({
    queryKey: ['selector-territories'],
    queryFn: listSelectorTerritories,
    staleTime: 5 * 60 * 1000,
  });
}
