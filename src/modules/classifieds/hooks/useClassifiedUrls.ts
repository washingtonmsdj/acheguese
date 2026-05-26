/**
 * useClassifiedUrls
 * 
 * Hook centralizado para URLs do módulo de classificados.
 * Respeita contexto territorial quando disponível.
 * 
 * SSOT para navegação de classificados - nunca construir URLs manualmente.
 * 
 * @param routeResolved - Território resolvido pela rota (opcional).
 *   Quando dentro de TerritorialLayout, passar o resolved do useTerritorialContext().
 *   Quando fora (header, sidebar global), deixar undefined para usar activeTerritory.
 */

import { useActiveTerritory } from '@/core/location/hooks/useActiveTerritory';
import { buildGroupBaseUrl, buildModuleTerritoryUrl, geoPathToPublicUrl, MODULE_SLUGS } from '@/core/routing/utils/territoryUrls';
import { LAUNCH_URLS } from '@/config/territory';
import { classifiedUrlService } from '@/modules/classifieds/services';
import type { ResolvedTerritory } from '@/core/routing/hooks/useResolveTerritoryFromUrl';
import type { ClassifiedUrlContext } from '@/modules/classifieds/services/ClassifiedUrlService';

export interface ClassifiedUrls {
  /** Lista de classificados: /classificados/ba/salvador ou /classificados/ba/salvador/complexo-do-nordeste */
  list: string;
  /** Detalhe de classificado: /classificados/{id} (global, não territorial) - DEPRECATED */
  detail: (id: string) => string;
  /** Novo classificado: /classificados/novo (global) */
  new: string;
  /** Editar classificado: /classificados/editar/{id} (global) */
  edit: (id: string) => string;
  /** Perfil do vendedor: /classificados/vendedor/{sellerId} (global) */
  seller: (sellerId: string) => string;
  /** URL canônica completa (para navegação interna) */
  canonical: (ctx: ClassifiedUrlContext) => string;
  /** URL curta de compartilhamento (apenas para share) */
  short: (publicId: string) => string;
}

export function useClassifiedUrls(routeResolved?: ResolvedTerritory | null): ClassifiedUrls {
  const { activeLocation } = useActiveTerritory();

  // Prioridade: contexto de rota territorial (group ou location)
  let listUrl: string;
  
  if (routeResolved) {
    if (routeResolved.kind === 'group') {
      // Grupo: /classificados/ba/salvador/complexo-do-nordeste-de-amaralina
      const firstMember = routeResolved.group.members[0];
      if (firstMember?.geographic_path) {
        const parts = firstMember.geographic_path.split('/').filter(Boolean);
        const groupBase = buildGroupBaseUrl(routeResolved.group, `/${parts[0]}/${parts[1]}/${parts[2]}`);
        listUrl = buildModuleTerritoryUrl(MODULE_SLUGS.classifieds, groupBase);
      } else {
        listUrl = LAUNCH_URLS.classifieds;
      }
    } else {
      // Location: /classificados/ba/salvador ou /classificados/ba/salvador/pituba
      listUrl = buildModuleTerritoryUrl(MODULE_SLUGS.classifieds, geoPathToPublicUrl(routeResolved.location.geographic_path));
    }
  } else if (activeLocation?.geographic_path) {
    // Fallback: store global (quando fora de rota territorial)
    listUrl = buildModuleTerritoryUrl(MODULE_SLUGS.classifieds, geoPathToPublicUrl(activeLocation.geographic_path));
  } else {
    // Default: cidade de lançamento
    listUrl = LAUNCH_URLS.classifieds;
  }

  return {
    list: listUrl,
    /** @deprecated Usar canonical ou short */
    detail: (id: string) => `/classificados/${id}`,
    new: '/classificados/novo',
    edit: (id: string) => `/classificados/editar/${id}`,
    seller: (sellerId: string) => `/classificados/vendedor/${sellerId}`,
    canonical: (ctx: ClassifiedUrlContext) => classifiedUrlService.buildUrls(ctx).canonical,
    short: (publicId: string) => classifiedUrlService.buildShortUrl(publicId),
  };
}


