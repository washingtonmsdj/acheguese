/**
 * resolveLocationDescendants - Resolve location + descendants for hierarchical queries
 *
 * Converte um TerritoryFilter com scope='location' em scope='group' incluindo
 * o location_id + todos os descendentes.
 *
 * Usado para queries hierárquicas onde queremos incluir resultados em child locations.
 *
 * @module core/location/utils
 */
import { logger } from '@/shared/utils/logger';
import { LocationHierarchyReadService } from '../services/LocationHierarchyReadService';
import type { TerritoryFilter } from '../types';

/**
 * Resolve location descendants para query hierárquica.
 *
 * A expansão usa o read model canônico de IDs, evitando carregar rows completas
 * de locations + count exact quando o consumidor precisa somente do filtro.
 *
 * @param filter - Filtro territorial original
 * @returns Filtro com descendentes resolvidos (se aplicável)
 */
export async function resolveLocationDescendants(
  filter: TerritoryFilter,
): Promise<TerritoryFilter> {
  if (filter.scope !== 'location') {
    return filter;
  }

  try {
    const locationIds = await LocationHierarchyReadService.getDescendantIds(
      filter.location_id,
    );

    if (locationIds.length === 0) {
      logger.warn(' No descendants found for location, using exact match');
      return filter;
    }

    return {
      scope: 'group',
      location_ids: locationIds,
    };
  } catch (err) {
    logger.warn(' Exception resolving descendants, using exact match:', err);
    return filter;
  }
}
