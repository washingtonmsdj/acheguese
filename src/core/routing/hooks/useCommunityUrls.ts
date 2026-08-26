import { LAUNCH_URLS } from "@/config/territory";
import { useActiveTerritory } from "@/core/location/hooks/useActiveTerritory";
import type { ResolvedTerritory } from "@/core/routing/hooks/useResolveTerritoryFromUrl";
import { useTerritorialContextOptional } from "@/core/routing/components/TerritorialLayout";
import { TERRITORIAL_ROUTE_STATIC_SEGMENTS } from "@/core/routing/config/territorialRoutePatterns";
import {
  buildCommunityTerritoryUrl,
  buildCommunityScopedUrl,
  buildModuleTerritoryUrl,
  geoPathToPublicUrl,
  MODULE_SLUGS,
} from "@/core/routing/utils/territoryUrls";
import { eventPublicRoutes } from "@/core/community-events/routes/eventPublicRoutes";

export interface CommunityUrls {
  feed: string;
  alerts: string;
  issues: string;
  communication: string;
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

function toPublicBaseFromGeographicPath(
  geographicPath: string | null | undefined,
): string | null {
  if (!geographicPath) return null;
  try {
    return geoPathToPublicUrl(geographicPath);
  } catch {
    return null;
  }
}

export function useCommunityUrls(
  routeResolved?: ResolvedTerritory | null,
): CommunityUrls {
  const { activeLocation } = useActiveTerritory();
  const territorialContext = useTerritorialContextOptional();
  const contextCommunityBaseUrl =
    !routeResolved || territorialContext?.resolved === routeResolved
      ? territorialContext?.communityBaseUrl
      : null;

  let communityBaseUrl: string;
  let eventsUrl: string;

  if (routeResolved && contextCommunityBaseUrl) {
    communityBaseUrl = contextCommunityBaseUrl;
    eventsUrl = `${contextCommunityBaseUrl}/${MODULE_SLUGS.events}`;
  } else if (routeResolved) {
    if (routeResolved.kind === "group") {
      const firstMember = routeResolved.group.members[0];
      const memberBase = toPublicBaseFromGeographicPath(
        firstMember?.geographic_path,
      );
      if (memberBase) {
        const parts = memberBase.split("/").filter(Boolean);
        if (parts.length < 2) {
          communityBaseUrl = LAUNCH_URLS.community;
          eventsUrl = LAUNCH_URLS.events;
        } else {
          const [state, city] = parts;
          if (!state || !city) {
            communityBaseUrl = LAUNCH_URLS.community;
            eventsUrl = LAUNCH_URLS.events;
          } else {
            const territoryBase = `/${state}/${city}/${routeResolved.group.slug}`;
            communityBaseUrl = buildCommunityTerritoryUrl(territoryBase);
            eventsUrl = buildModuleTerritoryUrl(
              MODULE_SLUGS.events,
              territoryBase,
            );
          }
        }
      } else {
        communityBaseUrl = LAUNCH_URLS.community;
        eventsUrl = LAUNCH_URLS.events;
      }
    } else {
      const territoryBase = toPublicBaseFromGeographicPath(
        routeResolved.location.geographic_path,
      );
      communityBaseUrl = territoryBase
        ? buildCommunityTerritoryUrl(territoryBase)
        : LAUNCH_URLS.community;
      eventsUrl = territoryBase
        ? buildModuleTerritoryUrl(MODULE_SLUGS.events, territoryBase)
        : LAUNCH_URLS.events;
    }
  } else if (activeLocation?.geographic_path) {
    const territoryBase = toPublicBaseFromGeographicPath(
      activeLocation.geographic_path,
    );
    communityBaseUrl = territoryBase
      ? buildCommunityTerritoryUrl(territoryBase)
      : LAUNCH_URLS.community;
    eventsUrl = territoryBase
      ? buildModuleTerritoryUrl(MODULE_SLUGS.events, territoryBase)
      : LAUNCH_URLS.events;
  } else {
    communityBaseUrl = LAUNCH_URLS.community;
    eventsUrl = LAUNCH_URLS.events;
  }

  const feedUrl = buildCommunityScopedUrl(
    communityBaseUrl,
    TERRITORIAL_ROUTE_STATIC_SEGMENTS.feed,
  );
  const alertsUrl = `${feedUrl}?tab=alertas`;
  const issuesUrl = `${communityBaseUrl}/problemas`;
  const communicationUrl = `${communityBaseUrl}/comunicacao`;
  const groupsUrl = `${communityBaseUrl}/grupos`;

  return {
    feed: feedUrl,
    alerts: alertsUrl,
    issues: issuesUrl,
    communication: communicationUrl,
    events: eventsUrl,
    eventDetail: (id: string) =>
      eventPublicRoutes.detailFromBase(eventsUrl, id),
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
