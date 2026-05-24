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
import { createLocationRepository } from '../repositories/createLocationRepository';
import type { TerritoryFilter } from '../types';
/**
 * Resolve location descendants para query hierárquica
 * 
 * Se filter.scope === 'location', busca todos os descendentes e retorna
 * um novo filter com scope='group' contendo [location_id, ...descendant_ids]
 * 
 * Caso contrário, retorna o filter original sem modificação.
 * 
 * @param filter - Filtro territorial original
 * @returns Filtro com descendentes resolvidos (se aplicável)
 * 
 * @example
 * ```typescript
 * // Input: { scope: 'location', location_id: 'salvador-uuid' }
 * const resolved = await resolveLocationDescendants(filter);
 * // Output: { scope: 'group', location_ids: ['salvador-uuid', 'nordeste-uuid', ...] }
 * ```
 */
export async function resolveLocationDescendants(
  filter: TerritoryFilter
): Promise<TerritoryFilter> {
  // Só processa se for scope='location'
  if (filter.scope !== 'location') {
    return filter;
  }

  try {
    const repository = createLocationRepository();
    const pageSize = 1000;
    let page = 1;
    let totalCount = 0;
    const allIds = new Set<string>();

    do {
      const { locations, total_count } = await repository.findDescendants(filter.location_id, {
        include_self: true,
        page,
        page_size: pageSize,
      });

      totalCount = total_count;
      locations.forEach((location) => allIds.add(location.id));
      page += 1;
    } while ((page - 1) * pageSize < totalCount);

    if (allIds.size === 0) {
      logger.warn(' No descendants found for location, using exact match');
      return filter; // Fallback: usa filtro original
    }

    // Converte para scope='group' com array de IDs
    return {
      scope: 'group',
      location_ids: Array.from(allIds),
    };
  } catch (err) {
    logger.warn(' Exception resolving descendants, using exact match:', err);
    return filter; // Fallback: usa filtro original
  }
}
