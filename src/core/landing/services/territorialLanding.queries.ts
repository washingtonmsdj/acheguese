import { logger } from '@/shared/utils/logger';
import { territorialGroupService } from '@/core/territorial';
import { createLocationRepository } from '@/core/location/repositories/createLocationRepository';
import {
  isTerritoryVisibleInLanding,
  type TerritoryVisibilityMetadata,
} from '@/core/routing/utils/territoryVisibility';
import type {
  ActiveTerritoriesWithLanding,
  TerritorialGroupData,
} from './types';

function asTerritoryVisibilityMetadata(value: unknown): TerritoryVisibilityMetadata | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as TerritoryVisibilityMetadata;
}

/**
 * Landing adapter for territorial groups.
 * Group persistence and membership resolution stay owned by core/territorial;
 * geographic anchor data stays owned by core/location.
 */
export async function getTerritorialGroups(): Promise<TerritorialGroupData[]> {
  try {
    const [groups, locations] = await Promise.all([
      territorialGroupService.listAllGroups(),
      createLocationRepository().findAll(),
    ]);
    const locationsById = new Map(locations.map((location) => [location.id, location]));

    const result = groups
      .filter((group) =>
        isTerritoryVisibleInLanding(asTerritoryVisibilityMetadata(group.metadata)),
      )
      .map((group) => ({
        id: group.id,
        name: group.name,
        slug: group.slug,
        description: group.description ?? undefined,
        anchor_city_id: group.anchor_city_id,
        anchor_path: locationsById.get(group.anchor_city_id)?.geographic_path,
        member_count: group.members.length,
      }));

    logger.info('territorialLanding.queries.getTerritorialGroups', {
      count: result.length,
    });

    return result;
  } catch (error) {
    logger.error('territorialLanding.queries.getTerritorialGroups', error);
    return [];
  }
}

/**
 * Canonical landing inventory of public city/district locations plus groups.
 * This composes the location and territorial owners without querying either
 * group's tables from the Landing bounded context.
 */
export async function getActiveTerritoriesWithLanding(): Promise<ActiveTerritoriesWithLanding> {
  try {
    const [locations, groups] = await Promise.all([
      createLocationRepository().findAll(),
      territorialGroupService.listAllGroups(),
    ]);
    const locationsById = new Map(locations.map((location) => [location.id, location]));

    const result: ActiveTerritoriesWithLanding = {
      locations: locations
        .filter(
          (location) =>
            location.status === 'active' &&
            (location.type === 'city' ||
              location.type === 'district' ||
              location.type === 'neighborhood') &&
            isTerritoryVisibleInLanding(
              asTerritoryVisibilityMetadata(location.metadata),
            ),
        )
        .map((location) => ({
          id: location.id,
          name: location.name,
          slug: location.slug,
          type: location.type,
          geographic_path: location.geographic_path,
          parent_name: location.parent_id
            ? locationsById.get(location.parent_id)?.name ?? null
            : null,
        })),
      groups: groups
        .filter((group) =>
          isTerritoryVisibleInLanding(
            asTerritoryVisibilityMetadata(group.metadata),
          ),
        )
        .map((group) => ({
          id: group.id,
          name: group.name,
          slug: group.slug,
          description: group.description,
          member_count: group.members.length,
          anchor_path: locationsById
            .get(group.anchor_city_id)
            ?.geographic_path.replace(/^\/br/, ''),
        })),
    };

    logger.info('territorialLanding.queries.getActiveTerritoriesWithLanding', {
      locations: result.locations.length,
      groups: result.groups.length,
    });

    return result;
  } catch (error) {
    logger.error('territorialLanding.queries.getActiveTerritoriesWithLanding', error);
    return { locations: [], groups: [] };
  }
}
