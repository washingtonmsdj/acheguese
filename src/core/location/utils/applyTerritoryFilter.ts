/**
 * applyTerritoryFilter - Utilitario para aplicar filtro territorial em queries Supabase
 *
 * SSOT: unica implementacao da logica de filtro territorial.
 */

import type { TerritoryFilter } from '../types';

type TerritorialQuery<TSelf> = {
  eq: (column: string, value: string) => TSelf;
  in: (column: string, values: string[]) => TSelf;
};

/**
 * Aplica filtro territorial a uma query do Supabase.
 */
export function applyTerritoryFilter<T extends TerritorialQuery<T>>(
  query: T,
  filter: TerritoryFilter,
): T {
  if (filter.scope === 'location') {
    return query.eq('location_id', filter.location_id);
  }

  if (filter.scope === 'group') {
    return query.in('location_id', filter.location_ids);
  }

  return query;
}
