/**
 * applyTerritoryFilter - Utilitário para aplicar filtro territorial em queries Supabase
 * 
 * ✅ SSOT - Única implementação da lógica de filtro territorial
 * ✅ Type-safe - Genérico para qualquer query builder
 * ✅ Reutilizável - Usado por todos os services
 * ✅ HIERÁRQUICO - Inclui location + descendentes automaticamente
 * 
 * @module core/location/utils
 */

import type { TerritoryFilter } from '../types';

/**
 * Aplica filtro territorial a uma query do Supabase
 * 
 * Comportamento:
 * - scope: 'location' → .eq('location_id', id) - EXACT MATCH apenas
 * - scope: 'group' → .in('location_id', ids)
 * - scope: 'none' → retorna query sem modificação
 * 
 * NOTA: Para queries hierárquicas (incluir descendentes), use applyTerritoryFilterHierarchical
 * 
 * @param query - Query builder do Supabase (tipado genericamente)
 * @param filter - Filtro territorial resolvido via useTerritoryFilter
 * @returns Query com filtro territorial aplicado
 * 
 * @example
 * ```typescript
 * const query = applyTerritoryFilter(baseQuery, filter);
 * ```
 */
export function applyTerritoryFilter<T>(
  query: T,
  filter: TerritoryFilter
): T {
  if (filter.scope === 'location') {
    // Type assertion necessária pois Supabase query builder não é tipado genericamente
    return (query as any).eq('location_id', filter.location_id);
  }
  
  if (filter.scope === 'group') {
    // Type assertion necessária pois Supabase query builder não é tipado genericamente
    return (query as any).in('location_id', filter.location_ids);
  }
  
  // scope: 'none' → não aplica filtro
  return query;
}
