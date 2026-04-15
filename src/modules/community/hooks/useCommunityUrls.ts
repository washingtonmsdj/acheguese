/**
 * useCommunityUrls
 * 
 * Hook centralizado para URLs do módulo de comunidade.
 * Respeita contexto territorial quando disponível.
 * 
 * SSOT para navegação de comunidade - nunca construir URLs manualmente.
 * 
 * @param routeResolved - Território resolvido pela rota (opcional).
 *   Quando dentro de TerritorialLayout, passar o resolved do useTerritorialContext().
 *   Quando fora (header, sidebar global), deixar undefined para usar activeTerritory.
 */

import { useActiveTerritory } from '@/core/location/hooks/useActiveTerritory';
import { geoPathToPublicUrl } from '@/core/routing/utils/territoryUrls';
import { TERRITORY_CONFIG } from '@/config/territory';
import type { ResolvedTerritory } from '@/core/routing/hooks/useResolveTerritoryFromUrl';

export interface CommunityUrls {
  /** Feed da comunidade: /comunidade/ba/salvador ou /comunidade/ba/salvador/complexo-do-nordeste */
  feed: string;
  /** Eventos: /eventos/ba/salvador ou /eventos/ba/salvador/complexo-do-nordeste */
  events: string;
  /** Detalhe de evento: /eventos/{id} (global) */
  eventDetail: (id: string) => string;
  /** Grupos: /grupos (global) */
  groups: string;
  /** Detalhe de grupo: /grupos/{id} (global) */
  groupDetail: (id: string) => string;
  /** Recomendações: /recomendacoes (global) */
  recommendations: string;
  /** Nova recomendação: /recomendacoes/nova (global) */
  newRecommendation: string;
  /** Detalhe de recomendação: /recomendacoes/{id} (global) */
  recommendationDetail: (id: string) => string;
  /** Achados e perdidos: /achados-perdidos (global) */
  lostAndFound: string;
  /** Novo achado/perdido: /achados-perdidos/novo (global) */
  newLostAndFound: string;
  /** Detalhe achado/perdido: /achados-perdidos/{id} (global) */
  lostAndFoundDetail: (id: string) => string;
  /** Cupons: /cupons (global) */
  coupons: string;
  /** Novo post: /novo-post (global) */
  newPost: string;
}

export function useCommunityUrls(routeResolved?: ResolvedTerritory | null): CommunityUrls {
  const { activeLocation } = useActiveTerritory();

  // Prioridade: contexto de rota territorial (group ou location)
  let feedUrl: string;
  let eventsUrl: string;
  
  if (routeResolved) {
    if (routeResolved.kind === 'group') {
      // Grupo: /comunidade/ba/salvador/complexo-do-nordeste-de-amaralina
      const firstMember = routeResolved.group.members[0];
      if (firstMember?.geographic_path) {
        const parts = firstMember.geographic_path.split('/').filter(Boolean);
        const groupPath = `/${parts[1]}/${parts[2]}/${routeResolved.group.slug}`;
        feedUrl = `/comunidade${groupPath}`;
        eventsUrl = `/eventos${groupPath}`;
      } else {
        feedUrl = `/comunidade/${TERRITORY_CONFIG.launch.state}/${TERRITORY_CONFIG.launch.city}`;
        eventsUrl = `/eventos/${TERRITORY_CONFIG.launch.state}/${TERRITORY_CONFIG.launch.city}`;
      }
    } else {
      // Location: /comunidade/ba/salvador ou /comunidade/ba/salvador/pituba
      const geoUrl = geoPathToPublicUrl(routeResolved.location.geographic_path);
      feedUrl = `/comunidade${geoUrl}`;
      eventsUrl = `/eventos${geoUrl}`;
    }
  } else if (activeLocation?.geographic_path) {
    // Fallback: store global (quando fora de rota territorial)
    const geoUrl = geoPathToPublicUrl(activeLocation.geographic_path);
    feedUrl = `/comunidade${geoUrl}`;
    eventsUrl = `/eventos${geoUrl}`;
  } else {
    // Default: cidade de lançamento
    feedUrl = `/comunidade/${TERRITORY_CONFIG.launch.state}/${TERRITORY_CONFIG.launch.city}`;
    eventsUrl = `/eventos/${TERRITORY_CONFIG.launch.state}/${TERRITORY_CONFIG.launch.city}`;
  }

  return {
    feed: feedUrl,
    events: eventsUrl,
    eventDetail: (id: string) => `/eventos/${id}`,
    groups: '/grupos',
    groupDetail: (id: string) => `/grupos/${id}`,
    recommendations: '/recomendacoes',
    newRecommendation: '/recomendacoes/nova',
    recommendationDetail: (id: string) => `/recomendacoes/${id}`,
    lostAndFound: '/achados-perdidos',
    newLostAndFound: '/achados-perdidos/novo',
    lostAndFoundDetail: (id: string) => `/achados-perdidos/${id}`,
    coupons: '/cupons',
    newPost: '/novo-post',
  };
}
