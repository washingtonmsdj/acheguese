/**
 * useBusinessUrls
 * 
 * Hook centralizado para URLs do módulo de empresas.
 * Respeita contexto territorial quando disponível.
 * 
 * SSOT para navegação de empresas - nunca construir URLs manualmente.
 * 
 * @param routeResolved - Território resolvido pela rota (opcional).
 *   Quando dentro de TerritorialLayout, passar o resolved do useTerritorialContext().
 *   Quando fora (header, sidebar global), deixar undefined para usar activeTerritory.
 */

import { useActiveTerritory } from '@/core/location/hooks/useActiveTerritory';
import { geoPathToPublicUrl } from '@/core/routing/utils/territoryUrls';
import { TERRITORY_CONFIG } from '@/config/territory';
import { BusinessUrlService } from '@/core/business/services/BusinessUrlService';
import type { BusinessUrlContext } from '@/core/business/services/BusinessUrlService';
import type { ResolvedTerritory } from '@/core/routing/hooks/useResolveTerritoryFromUrl';

export interface BusinessUrls {
  /** Lista de empresas: /empresas/ba/salvador ou /empresas/ba/salvador/complexo-do-nordeste */
  list: string;
  /**
   * URL canônica pública da empresa: /empresas/:uf/:cidade/:slug
   * Requer contexto completo (slug + geographic_path).
   * Use BusinessUrlService.getCanonicalUrl() diretamente quando tiver o contexto.
   */
  canonical: (ctx: BusinessUrlContext) => string;
  /**
   * URL de compartilhamento: /p/:slug para premium, canônica para demais.
   */
  share: (ctx: BusinessUrlContext) => string;
  /** Criar empresa: /empresas/criar-empresa */
  create: string;
  /** Editar empresa: /edit-business/{businessId} (global) */
  edit: (businessId: string) => string;
  /** Gestao da empresa: /central/empresas/{businessId} (global) - usa Central por padrão */
  dashboard: (businessId: string, opts?: { target?: "central" | "legacy" }) => string;
}

export function useBusinessUrls(routeResolved?: ResolvedTerritory | null): BusinessUrls {
  const { activeLocation } = useActiveTerritory();

  // Prioridade: contexto de rota territorial (group ou location)
  let listUrl: string;
  
  if (routeResolved) {
    if (routeResolved.kind === 'group') {
      // Grupo: /empresas/ba/salvador/complexo-do-nordeste-de-amaralina
      const firstMember = routeResolved.group.members[0];
      if (firstMember?.geographic_path) {
        const parts = firstMember.geographic_path.split('/').filter(Boolean);
        listUrl = `/empresas/${parts[1]}/${parts[2]}/${routeResolved.group.slug}`;
      } else {
        listUrl = `/empresas/${TERRITORY_CONFIG.launch.state}/${TERRITORY_CONFIG.launch.city}`;
      }
    } else {
      // Location: /empresas/ba/salvador ou /empresas/ba/salvador/pituba
      listUrl = `/empresas${geoPathToPublicUrl(routeResolved.location.geographic_path)}`;
    }
  } else if (activeLocation?.geographic_path) {
    // Fallback: store global (quando fora de rota territorial)
    listUrl = `/empresas${geoPathToPublicUrl(activeLocation.geographic_path)}`;
  } else {
    // Default: cidade de lançamento
    listUrl = `/empresas/${TERRITORY_CONFIG.launch.state}/${TERRITORY_CONFIG.launch.city}`;
  }

  return {
    list: listUrl,
    canonical: (ctx: BusinessUrlContext) => BusinessUrlService.getCanonicalUrl(ctx),
    share: (ctx: BusinessUrlContext) => BusinessUrlService.getShareUrl(ctx),
    create: '/empresas/criar-empresa',
    edit: (businessId: string) => `/edit-business/${businessId}`,
    dashboard: (businessId: string, opts?: { target?: "central" | "legacy" }) => 
      opts?.target === "legacy" ? `/perfil/empresas/${businessId}` : `/central/empresas/${businessId}`,
  };
}
