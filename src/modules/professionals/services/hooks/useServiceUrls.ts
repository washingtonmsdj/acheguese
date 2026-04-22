/**
 * useServiceUrls
 * 
 * Hook centralizado para URLs do módulo de serviços.
 * Respeita contexto territorial quando disponível.
 * 
 * SSOT para navegação de serviços - nunca construir URLs manualmente.
 * 
 * @param routeResolved - Território resolvido pela rota (opcional).
 *   Quando dentro de TerritorialLayout, passar o resolved do useTerritorialContext().
 *   Quando fora (header, sidebar global), deixar undefined para usar activeTerritory.
 */

import { useActiveTerritory } from '@/core/location/hooks/useActiveTerritory';
import { geoPathToPublicUrl } from '@/core/routing/utils/territoryUrls';
import { TERRITORY_CONFIG } from '@/config/territory';
import type { ResolvedTerritory } from '@/core/routing/hooks/useResolveTerritoryFromUrl';

export interface ServiceUrls {
  /** Lista de serviços: /servicos/ba/salvador ou /servicos/ba/salvador/complexo-do-nordeste */
  list: string;
  /** Detalhe de serviço: /services/{id} (global, não territorial) */
  detail: (id: string) => string;
  /** Cadastrar serviço: /services/cadastrar (global) */
  register: string;
  /** Editar serviço: /services/{id}/editar (global) */
  edit: (id: string) => string;
}

export function useServiceUrls(routeResolved?: ResolvedTerritory | null): ServiceUrls {
  const { activeLocation } = useActiveTerritory();

  // Prioridade: contexto de rota territorial (group ou location)
  let listUrl: string;
  
  if (routeResolved) {
    if (routeResolved.kind === 'group') {
      // Grupo: /servicos/ba/salvador/complexo-do-nordeste-de-amaralina
      const firstMember = routeResolved.group.members[0];
      if (firstMember?.geographic_path) {
        const parts = firstMember.geographic_path.split('/').filter(Boolean);
        listUrl = `/servicos/${parts[1]}/${parts[2]}/${routeResolved.group.slug}`;
      } else {
        listUrl = `/servicos/${TERRITORY_CONFIG.launch.state}/${TERRITORY_CONFIG.launch.city}`;
      }
    } else {
      // Location: /servicos/ba/salvador ou /servicos/ba/salvador/pituba
      listUrl = `/servicos${geoPathToPublicUrl(routeResolved.location.geographic_path)}`;
    }
  } else if (activeLocation?.geographic_path) {
    // Fallback: store global (quando fora de rota territorial)
    listUrl = `/servicos${geoPathToPublicUrl(activeLocation.geographic_path)}`;
  } else {
    // Default: cidade de lançamento
    listUrl = `/servicos/${TERRITORY_CONFIG.launch.state}/${TERRITORY_CONFIG.launch.city}`;
  }

  return {
    list: listUrl,
    detail: (id: string) => `/services/${id}`,
    register: '/services/cadastrar',
    edit: (id: string) => `/services/${id}/editar`,
  };
}
