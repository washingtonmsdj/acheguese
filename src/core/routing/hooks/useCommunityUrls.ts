import { LAUNCH_URLS } from "@/config/territory";
import { useActiveTerritory } from "@/core/location/hooks/useActiveTerritory";
import type { ResolvedTerritory } from "@/core/routing/hooks/useResolveTerritoryFromUrl";
import {
  buildCityTerritoryBaseUrl,
  buildCommunityTerritoryUrl,
  buildModuleTerritoryUrl,
  geoPathToPublicUrl,
  MODULE_SLUGS,
} from "@/core/routing/utils/territoryUrls";
import { eventPublicRoutes } from "@/core/verticals/events/routes/eventPublicRoutes";

export interface CommunityUrls {
  feed: string;
  alerts: string;
  issues: string;
  events: string;
  eventDetail: (id: string) => string;
  eventFavorites: string;
  eventCalendar: string;
  eventMap: string;
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

function toCityBaseFromGeographicPath(geographicPath: string | null | undefined): string | null {
  if (!geographicPath) return null;
  try {
    return buildCityTerritoryBaseUrl(geoPathToPublicUrl(geographicPath));
  } catch {
    return null;
  }
}

export function useCommunityUrls(routeResolved?: ResolvedTerritory | null): CommunityUrls {
  const { activeLocation } = useActiveTerritory();

  let feedUrl: string;
  let eventsUrl: string;

  if (routeResolved) {
    if (routeResolved.kind === "group") {
      const firstMember = routeResolved.group.members[0];
      const cityBase = toCityBaseFromGeographicPath(firstMember?.geographic_path);
      if (cityBase) {
        feedUrl = buildCommunityTerritoryUrl(cityBase);
        eventsUrl = buildModuleTerritoryUrl(MODULE_SLUGS.events, cityBase);
      } else {
        feedUrl = LAUNCH_URLS.community;
        eventsUrl = LAUNCH_URLS.events;
      }
    } else {
      const cityBase = toCityBaseFromGeographicPath(routeResolved.location.geographic_path);
      feedUrl = cityBase ? buildCommunityTerritoryUrl(cityBase) : LAUNCH_URLS.community;
      eventsUrl = cityBase ? buildModuleTerritoryUrl(MODULE_SLUGS.events, cityBase) : LAUNCH_URLS.events;
    }
  } else if (activeLocation?.geographic_path) {
    const cityBase = toCityBaseFromGeographicPath(activeLocation.geographic_path);
    feedUrl = cityBase ? buildCommunityTerritoryUrl(cityBase) : LAUNCH_URLS.community;
    eventsUrl = cityBase ? buildModuleTerritoryUrl(MODULE_SLUGS.events, cityBase) : LAUNCH_URLS.events;
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
    eventDetail: (id: string) => eventPublicRoutes.detailFromBase(eventsUrl, id),
    eventFavorites: eventPublicRoutes.favoritesFromBase(eventsUrl),
    eventCalendar: eventPublicRoutes.calendarFromBase(eventsUrl),
    eventMap: eventPublicRoutes.mapFromBase(eventsUrl),
    groups: groupsUrl,
    groupDetail: (id: string) => `${groupsUrl}/${id}`,
    recommendations: "/recomendacoes",
    newRecommendation: "/recomendacoes/nova",
    recommendationDetail: (id: string) => `/recomendacoes/${id}`,
    lostAndFound: "/achados-perdidos",
    newLostAndFound: "/achados-perdidos/novo",
    lostAndFoundDetail: (id: string) => `/achados-perdidos/${id}`,
    coupons: "/cupons",
    newPost: "/novo-post",
  };
}
