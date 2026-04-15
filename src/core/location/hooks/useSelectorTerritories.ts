/**
 * useSelectorTerritories
 * 
 * Hook SSOT para buscar territórios ativos no seletor principal.
 * Substitui LAUNCH_TERRITORIES hardcoded — agora controlado via admin.
 * 
 * Busca locations e territorial_groups com metadata.is_selector_active = true.
 */

import { useQuery } from '@tanstack/react-query';
import {
  selectorTerritoryService,
  type SelectorTerritory,
} from '@/core/location/services/SelectorTerritoryService';

export function useSelectorTerritories() {
  return useQuery<SelectorTerritory[]>({
    queryKey: ['selector-territories'],
    queryFn: () => selectorTerritoryService.listSelectorTerritories(),
    staleTime: 5 * 60 * 1000,
  });
}
