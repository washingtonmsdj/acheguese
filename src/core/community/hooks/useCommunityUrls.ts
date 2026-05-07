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
import { buildCommunityTerritoryUrl, buildGroupBaseUrl, buildModuleTerritoryUrl, geoPathToPublicUrl, MODULE_SLUGS } from '@/core/routing/utils/territoryUrls';
import { TERRITORY_CONFIG } from '@/config/territory';
import type { ResolvedTerritory } from '@/core/routing/hooks/useResolveTerritoryFromUrl';

export interface CommunityUrls {
  feed: string;
  alerts: string;
  issues: string;
  events: string;
  eventDetail: (id: string) => string;
  groups: string;
  groupDetail: (id: string) => string;
  recommendations: string;
  newRecommendation: string;
  recommendationDetail: (id: string) => string;
  lostAndFound: string;
  newLostAndFound: string;
  lostAndFoundDetail: (id: string) => string;
  coupons: string;
  newPost: string;
}

export function useCommunityUrls(routeResolved?: ResolvedTerritory | null): CommunityUrls {
  const { activeLocation } = useActiveTerritory();

  let feedUrl: string;
  let eventsUrl: string;

  if (routeResolved) {
    if (routeResolved.kind === 'group') {
      const firstMember = routeResolved.group.members[0];
      if (firstMember?.geographic_path) {
        const parts = firstMember.geographic_path.split('/').filter(Boolean);
        const groupPath = buildGroupBaseUrl(routeResolved.group, `/${parts[0]}/${parts[1]}/${parts[2]}`);
        feedUrl = buildCommunityTerritoryUrl(groupPath);
        eventsUrl = buildModuleTerritoryUrl(MODULE_SLUGS.events, groupPath);
      } else {
        feedUrl = `/comunidade/${TERRITORY_CONFIG.launch.state}/${TERRITORY_CONFIG.launch.city}`;
        eventsUrl = `/eventos/${TERRITORY_CONFIG.launch.state}/${TERRITORY_CONFIG.launch.city}`;
      }
    } else {
      const geoUrl = geoPathToPublicUrl(routeResolved.location.geographic_path);
      feedUrl = buildCommunityTerritoryUrl(geoUrl);
      eventsUrl = buildModuleTerritoryUrl(MODULE_SLUGS.events, geoUrl);
    }
  } else if (activeLocation?.geographic_path) {
    const geoUrl = geoPathToPublicUrl(activeLocation.geographic_path);
    feedUrl = buildCommunityTerritoryUrl(geoUrl);
    eventsUrl = buildModuleTerritoryUrl(MODULE_SLUGS.events, geoUrl);
  } else {
    feedUrl = `/comunidade/${TERRITORY_CONFIG.launch.state}/${TERRITORY_CONFIG.launch.city}`;
    eventsUrl = `/eventos/${TERRITORY_CONFIG.launch.state}/${TERRITORY_CONFIG.launch.city}`;
  }

  const alertsUrl = `${feedUrl}/alertas`;
  const issuesUrl = `${feedUrl}/problemas`;

  return {
    feed: feedUrl,
    alerts: alertsUrl,
    issues: issuesUrl,
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
