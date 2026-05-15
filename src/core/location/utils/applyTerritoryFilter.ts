/**
 * applyTerritoryFilter - Utilitario para aplicar filtro territorial em queries Supabase
 *
 * SSOT: unica implementacao da logica de filtro territorial.
 */

import type { TerritoryFilter } from '../types';

type TerritorialQuery = {
  eq: (column: string, value: string) => unknown;
  in: (column: string, values: string[]) => unknown;
};

/**
 * Aplica filtro territorial a uma query do Supabase.
 */
export function applyTerritoryFilter<T extends TerritorialQuery>(
  query: T,
  filter: TerritoryFilter,
): T {
  if (filter.scope === 'location') {
    query.eq('location_id', filter.location_id);
    return query;
  }

  if (filter.scope === 'group') {
    query.in('location_id', filter.location_ids);
    return query;
  }

  return query;
}
