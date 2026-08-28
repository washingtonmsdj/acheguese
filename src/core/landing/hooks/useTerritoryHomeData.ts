import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { isLaunchSurfaceEnabled } from "@/app/config/launchScope";
import { useLandingFeatured } from "@/core/landing/hooks/useLandingFeatured";
import {
  selectEventsHappeningSoon,
  hasTechnicalSeedLabel,
  selectRecentPosts,
  selectValidEvents,
} from "@/core/landing/utils/territoryHomeFreshness";
import {
  isTerritoryFilterReady,
  territoryFilterKey,
} from "@/core/location/hooks/useTerritoryFilter";
import type { TerritoryFilter } from "@/core/location/types";
import { postService } from "@/core/posts/services";
import type { FeedParams } from "@/core/posts/types";
import type { ResolvedTerritory } from "@/core/routing/hooks/useResolveTerritoryFromUrl";
import { useTerritorialHighlights } from "@/core/territorial/highlights/useTerritorialHighlights";
import { eventsReadService } from "@/core/community-events";
import { WorkOpportunitiesService } from "@/core/work-opportunities/services/WorkOpportunitiesService";

const HOME_STALE_TIME = 2 * 60 * 1000;

interface UseTerritoryHomeDataInput {
  resolved: ResolvedTerritory;
  territoryFilter: TerritoryFilter;
  resolvedLocationIds: readonly string[];
  territoryLoading: boolean;
  communityEnabled: boolean;
}

function toFeedParams(filter: TerritoryFilter): FeedParams {
  if (filter.scope === "location") {
    return {
      location_id: filter.location_id,
      district_filter: true,
      limit: 8,
    };
  }

  if (filter.scope === "group") {
    return {
      location_ids: [...filter.location_ids],
      limit: 8,
    };
  }

  return { limit: 8 };
}

export function useTerritoryHomeData({
  resolved,
  territoryFilter,
  resolvedLocationIds,
  territoryLoading,
  communityEnabled,
}: UseTerritoryHomeDataInput) {
  const filterKey = territoryFilterKey(territoryFilter);
  const filterReady = isTerritoryFilterReady(territoryFilter);
  const featured = useLandingFeatured(territoryFilter, {
    enabled: filterReady,
    includeStats: false,
    limit: 12,
  });
  const highlights = useTerritorialHighlights(resolved);

  const postsQuery = useQuery({
    queryKey: ["territory-home", "posts", filterKey],
    queryFn: () => postService.getFeed(toFeedParams(territoryFilter)),
    enabled:
      filterReady && communityEnabled && isLaunchSurfaceEnabled("community"),
    staleTime: HOME_STALE_TIME,
    retry: false,
  });

  const eventsQuery = useQuery({
    queryKey: ["territory-home", "events", filterKey],
    queryFn: async () => {
      const [upcoming, ongoing] = await Promise.all([
        eventsReadService.getEventsPage({
          territoryFilter,
          status: "upcoming",
          upcoming: true,
          page: 0,
          pageSize: 8,
          sortBy: "date",
          sortOrder: "asc",
        }),
        eventsReadService.getEventsPage({
          territoryFilter,
          status: "ongoing",
          page: 0,
          pageSize: 4,
          sortBy: "date",
          sortOrder: "asc",
        }),
      ]);
      return [...ongoing.items, ...upcoming.items];
    },
    enabled: filterReady && isLaunchSurfaceEnabled("events"),
    staleTime: HOME_STALE_TIME,
    retry: false,
  });

  const opportunitiesQuery = useQuery({
    queryKey: ["territory-home", "opportunities", filterKey],
    queryFn: () =>
      WorkOpportunitiesService.listPublicOpportunityCards({
        territoryLocationIds: resolvedLocationIds,
        limit: 8,
      }),
    enabled:
      filterReady &&
      resolvedLocationIds.length > 0 &&
      isLaunchSurfaceEnabled("jobs"),
    staleTime: HOME_STALE_TIME,
    retry: false,
  });

  const now = Date.now();
  const posts = useMemo(
    () => selectRecentPosts(postsQuery.data?.posts ?? [], now),
    [now, postsQuery.data?.posts],
  );
  const businesses = useMemo(
    () =>
      featured.businesses.filter(
        (item) =>
          !hasTechnicalSeedLabel(item.name) &&
          !hasTechnicalSeedLabel(item.slug),
      ),
    [featured.businesses],
  );
  const services = useMemo(
    () =>
      featured.services.filter(
        (item) =>
          !hasTechnicalSeedLabel(item.name) &&
          !hasTechnicalSeedLabel(item.slug),
      ),
    [featured.services],
  );
  const gastronomy = useMemo(
    () =>
      featured.gastronomy.filter(
        (item) =>
          !hasTechnicalSeedLabel(item.name) &&
          !hasTechnicalSeedLabel(item.slug),
      ),
    [featured.gastronomy],
  );
  const events = useMemo(
    () => selectValidEvents(eventsQuery.data ?? [], now),
    [eventsQuery.data, now],
  );
  const happeningSoon = useMemo(
    () => selectEventsHappeningSoon(events, now),
    [events, now],
  );
  const classifieds = useMemo(
    () =>
      featured.classifieds.filter(
        (item) =>
          !hasTechnicalSeedLabel(item.titulo) &&
          !hasTechnicalSeedLabel(item.slug),
      ),
    [featured.classifieds],
  );
  const opportunities = useMemo(
    () =>
      (opportunitiesQuery.data ?? []).filter(
        (item) =>
          !hasTechnicalSeedLabel(item.headline) &&
          !hasTechnicalSeedLabel(item.description),
      ),
    [opportunitiesQuery.data],
  );
  const publicHighlights = useMemo(
    () =>
      (highlights.data ?? []).filter(
        (item) =>
          !hasTechnicalSeedLabel(item.title) &&
          !hasTechnicalSeedLabel(item.subtitle),
      ),
    [highlights.data],
  );

  const loading = {
    territory: territoryLoading,
    worthKnowing:
      territoryLoading ||
      featured.loading.classifieds ||
      eventsQuery.isLoading ||
      opportunitiesQuery.isLoading ||
      highlights.isLoading,
    community: territoryLoading || (communityEnabled && postsQuery.isLoading),
    usefulPlaces:
      territoryLoading ||
      featured.loading.businesses ||
      featured.loading.services,
  } as const;

  return {
    businesses,
    services,
    gastronomy,
    classifieds,
    posts,
    events,
    happeningSoon,
    opportunities,
    highlights: publicHighlights,
    loading,
    isLoading:
      territoryLoading ||
      featured.isLoading ||
      (communityEnabled && postsQuery.isLoading) ||
      eventsQuery.isLoading ||
      opportunitiesQuery.isLoading ||
      highlights.isLoading,
    hasError:
      featured.isError ||
      postsQuery.isError ||
      eventsQuery.isError ||
      opportunitiesQuery.isError ||
      highlights.isError,
  };
}
