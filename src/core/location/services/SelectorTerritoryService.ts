/**
 * SelectorTerritoryService
 *
 * SSOT para territórios exibidos no seletor global.
 * Centraliza leitura de locations e grupos territoriais ativos para navegação.
 */

import { createLocationRepository } from '@/core/location/repositories/createLocationRepository';
import { createTerritorialGroupRepository } from '@/core/location/repositories/createTerritorialGroupRepository';
import { isTerritoryPubliclyNavigable, isTerritorySelectorActive } from '@/core/routing/utils/territoryVisibility';

export interface SelectorTerritory {
  kind: 'location' | 'group';
  id: string;
  slug: string;
  name: string;
  path: string;
  description?: string;
  type?: string;
}

export class SelectorTerritoryService {
  static async listSelectorTerritories(): Promise<SelectorTerritory[]> {
    const locationRepository = createLocationRepository();
    const groupRepository = createTerritorialGroupRepository();

    const [allLocations, allGroups] = await Promise.all([
      locationRepository.findAll(),
      groupRepository.listAll(),
    ]);

    const locationResults: SelectorTerritory[] = allLocations
      .filter(
        (location) =>
          location.status === 'active' &&
          (location.type === 'city' || location.type === 'district') &&
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
        description: location.type === 'city' ? 'Cidade' : location.full_name,
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
        const anchorPath = anchorCity?.geographic_path?.replace(/^\/br/, '') || '';
        const path = anchorPath ? `${anchorPath}/area/${group.slug}` : `/area/${group.slug}`;

        return {
          kind: 'group' as const,
          id: group.id,
          slug: group.slug,
          name: group.name,
          path,
          description: group.description || 'Grupo territorial',
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    return [...locationResults, ...groupResults];
  }
}

export const selectorTerritoryService = SelectorTerritoryService;
