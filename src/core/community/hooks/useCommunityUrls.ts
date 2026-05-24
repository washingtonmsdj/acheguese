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
import { buildCommunityTerritoryUrl, buildModuleTerritoryUrl, geoPathToPublicUrl, MODULE_SLUGS } from '@/core/routing/utils/territoryUrls';
import { LAUNCH_URLS } from '@/config/territory';
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

function hasCommunityTerritorySlug(publicPath: string): boolean {
  return publicPath.split('/').filter(Boolean).length >= 3;
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
        const communityTerritoryPath = `/${parts[1]}/${parts[2]}/${routeResolved.group.slug}`;
        feedUrl = buildCommunityTerritoryUrl(communityTerritoryPath);
        eventsUrl = buildModuleTerritoryUrl(MODULE_SLUGS.events, communityTerritoryPath);
      } else {
        feedUrl = LAUNCH_URLS.community;
        eventsUrl = LAUNCH_URLS.events;
      }
    } else {
      const geoUrl = geoPathToPublicUrl(routeResolved.location.geographic_path);
      feedUrl = hasCommunityTerritorySlug(geoUrl) ? buildCommunityTerritoryUrl(geoUrl) : LAUNCH_URLS.community;
      eventsUrl = hasCommunityTerritorySlug(geoUrl) ? buildModuleTerritoryUrl(MODULE_SLUGS.events, geoUrl) : LAUNCH_URLS.events;
    }
  } else if (activeLocation?.geographic_path) {
    const geoUrl = geoPathToPublicUrl(activeLocation.geographic_path);
    feedUrl = hasCommunityTerritorySlug(geoUrl) ? buildCommunityTerritoryUrl(geoUrl) : LAUNCH_URLS.community;
    eventsUrl = hasCommunityTerritorySlug(geoUrl) ? buildModuleTerritoryUrl(MODULE_SLUGS.events, geoUrl) : LAUNCH_URLS.events;
  } else {
    feedUrl = LAUNCH_URLS.community;
    eventsUrl = LAUNCH_URLS.events;
  }

  const alertsUrl = `${feedUrl}/feed?tab=alertas`;
  const issuesUrl = `${feedUrl}/problemas`;
  const groupsUrl = `${feedUrl}/grupos`;

  return {
    feed: feedUrl,
    alerts: alertsUrl,
    issues: issuesUrl,
    events: eventsUrl,
    eventDetail: (id: string) => `/eventos/${id}`,
    groups: groupsUrl,
    groupDetail: (id: string) => `${groupsUrl}/${id}`,
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
