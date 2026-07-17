import { BusinessService } from "@/core/business";
import type { Business } from "@/core/business/types/Business";
import {
  ClassifiedUrlService,
  searchClassifieds,
} from "@/core/classifieds/services";
import { CommunityExperienceService } from "@/core/community-experience/services/CommunityExperienceService";
import { ProfessionalService } from "@/core/professional/services/ProfessionalService";
import { ProfessionalUrlService } from "@/core/professional/services/ProfessionalUrlService";
import { searchPublicPosts } from "@/core/posts/services";
import type { Professional } from "@/core/professional/types";
import { eventsReadService } from "@/core/verticals/events";
import { eventPublicRoutes } from "@/core/verticals/events/routes/eventPublicRoutes";
import {
  WorkOpportunitiesService,
  type WorkOpportunityCard,
} from "@/core/work-opportunities";
import { isLaunchSurfaceEnabled } from "@/config/launchScope";
import {
  getCommunitySearchCandidateLimit,
  SEARCH_RESULT_LIMITS,
} from "@/core/search/config/searchConfig";
import type {
  CommunityLinkedEntityIds,
  SearchBucket,
  SearchFilters,
  SearchLinkedEntityType,
  SearchProvider,
  SearchProviderInput,
  SearchProviderResult,
  SearchResults,
  WorkOpportunitySearchResult,
} from "@/core/search/contracts";
import {
  businessToSearchDocument,
  classifiedToSearchDocument,
  communityToSearchDocument,
  eventToSearchDocument,
  opportunityToSearchDocument,
  postToSearchDocument,
  professionalToSearchDocument,
} from "@/core/search/services/SearchDocumentMapper";

const SEARCH_LIMIT = SEARCH_RESULT_LIMITS.DEFAULT;

function throwIfAborted(signal?: AbortSignal): void {
  if (!signal?.aborted) return;
  throw signal.reason instanceof Error
    ? signal.reason
    : new DOMException("Search aborted", "AbortError");
}

function domainLimit(filters: SearchFilters): number {
  return filters.communityId ? getCommunitySearchCandidateLimit() : SEARCH_LIMIT;
}

function filterByLinkedEntityIds<T>(
  items: readonly T[],
  linkedIds: CommunityLinkedEntityIds,
  entityType: SearchLinkedEntityType,
  getEntityId: (item: T) => string | null | undefined,
  requireLinkedEntity: boolean,
): T[] {
  const ids = linkedIds[entityType];
  if (!ids?.size) return requireLinkedEntity ? [] : [...items].slice(0, SEARCH_LIMIT);

  return items
    .filter((item) => {
      const entityId = getEntityId(item);
      return Boolean(entityId && ids.has(entityId));
    })
    .slice(0, SEARCH_LIMIT);
}

function result<K extends SearchBucket>(
  bucket: K,
  items: SearchResults[K],
  documents: SearchProviderResult["documents"],
): SearchProviderResult {
  return {
    bucket,
    documents,
    payload: { [bucket]: items } as Pick<SearchResults, K>,
  };
}

function toOpportunity(card: WorkOpportunityCard): WorkOpportunitySearchResult {
  return {
    id: card.id,
    headline: card.headline,
    professional_category: card.professional_category,
    opportunity_type: card.opportunity_type,
    territory_name: card.territory_name,
    urgency: card.urgency,
    availability_notes: card.availability_notes,
    professional_id: card.professional_id,
    professional_name: card.professional_name,
    post_id: card.post_id,
    source_kind: "work_opportunity",
    target_url: `/oportunidades/${card.id}`,
    published_at: card.published_at,
    created_at: card.created_at,
  };
}

const communitiesProvider: SearchProvider = {
  bucket: "communities",
  linkedEntityTypes: [],
  isEnabled: () => true,
  async search({ query, filters, signal }) {
    throwIfAborted(signal);
    const found = await CommunityExperienceService.searchPublicCommunities(query, 12);
    throwIfAborted(signal);
    const communities = filters.communityId
      ? found.filter((community) => community.id === filters.communityId)
      : found;
    return result(
      "communities",
      communities,
      communities.map(communityToSearchDocument),
    );
  },
};

const businessesProvider: SearchProvider = {
  bucket: "businesses",
  linkedEntityTypes: ["business"],
  isEnabled: () => true,
  async search({ query, filters, linkedEntityIds, signal }) {
    throwIfAborted(signal);
    const page = await BusinessService.getBusinessesList({
      searchQuery: query,
      pageSize: domainLimit(filters),
      pageParam: 0,
      filter: filters.territoryFilter,
    });
    throwIfAborted(signal);
    const businesses = filterByLinkedEntityIds(
      page.businesses as Business[],
      linkedEntityIds,
      "business",
      (business) => business.id,
      Boolean(filters.communityId),
    );
    return result("businesses", businesses, businesses.map(businessToSearchDocument));
  },
};

const professionalsProvider: SearchProvider = {
  bucket: "professionals",
  linkedEntityTypes: ["professional"],
  isEnabled: () => true,
  async search({ query, filters, linkedEntityIds, signal }) {
    throwIfAborted(signal);
    const found = await ProfessionalService.searchProfessionals(query, {
      city: filters.city,
      neighborhood: filters.neighborhood,
      min_rating: filters.minRating,
      territoryFilter: filters.territoryFilter,
    });
    throwIfAborted(signal);
    const mapped = (found as Professional[]).map((professional) => ({
      ...professional,
      target_url: ProfessionalUrlService.getCanonicalUrlFromTarget(professional),
    }));
    const professionals = filterByLinkedEntityIds(
      mapped,
      linkedEntityIds,
      "professional",
      (professional) => professional.professional_data_id,
      Boolean(filters.communityId),
    );
    return result(
      "professionals",
      professionals,
      professionals.map(professionalToSearchDocument),
    );
  },
};

const opportunitiesProvider: SearchProvider = {
  bucket: "opportunities",
  linkedEntityTypes: [],
  isEnabled: () => isLaunchSurfaceEnabled("jobs"),
  async search({ query, filters, signal }) {
    throwIfAborted(signal);
    if (filters.communityId && !filters.territoryFilter) {
      return result("opportunities", [], []);
    }
    const cards = await WorkOpportunitiesService.listPublicOpportunityCards({
      search: query,
      territoryLocationId:
        filters.territoryFilter?.scope === "location"
          ? filters.territoryFilter.location_id
          : undefined,
      limit: SEARCH_LIMIT,
    });
    throwIfAborted(signal);
    const opportunities = cards.map(toOpportunity);
    return result(
      "opportunities",
      opportunities,
      opportunities.map(opportunityToSearchDocument),
    );
  },
};

const classifiedsProvider: SearchProvider = {
  bucket: "classifieds",
  linkedEntityTypes: ["classified"],
  isEnabled: () => true,
  async search({ query, filters, linkedEntityIds, signal }) {
    throwIfAborted(signal);
    const found = await searchClassifieds(query, {
      filter: filters.territoryFilter,
      limit: domainLimit(filters),
    });
    throwIfAborted(signal);
    const mapped = found.map((classified) => ({
      ...classified,
      target_url: ClassifiedUrlService.buildPublicUrl(classified),
    }));
    const classifieds = filterByLinkedEntityIds(
      mapped,
      linkedEntityIds,
      "classified",
      (classified) => classified.id,
      Boolean(filters.communityId),
    );
    return result(
      "classifieds",
      classifieds,
      classifieds.map(classifiedToSearchDocument),
    );
  },
};

const eventsProvider: SearchProvider = {
  bucket: "events",
  linkedEntityTypes: ["event"],
  isEnabled: () => isLaunchSurfaceEnabled("events"),
  async search({ query, filters, linkedEntityIds, signal }) {
    throwIfAborted(signal);
    const page = await eventsReadService.getEventsPage({
      search: query,
      territoryFilter: filters.territoryFilter,
      statuses: ["upcoming", "ongoing"],
      pageSize: domainLimit(filters),
      sortBy: "date",
      sortOrder: "asc",
    });
    throwIfAborted(signal);
    const mapped = page.items.map((event) => ({
      ...event,
      target_url: eventPublicRoutes.detail(event.id),
    }));
    const events = filterByLinkedEntityIds(
      mapped,
      linkedEntityIds,
      "event",
      (event) => event.id,
      Boolean(filters.communityId),
    );
    return result("events", events, events.map(eventToSearchDocument));
  },
};

const postsProvider: SearchProvider = {
  bucket: "posts",
  linkedEntityTypes: ["post"],
  isEnabled: () => true,
  async search({ query, filters, linkedEntityIds, signal }) {
    throwIfAborted(signal);
    const found = await searchPublicPosts(query, {
      territoryFilter: filters.territoryFilter,
      limit: domainLimit(filters),
    });
    throwIfAborted(signal);
    const mapped = found.map((post) => ({ ...post, target_url: null }));
    const posts = filterByLinkedEntityIds(
      mapped,
      linkedEntityIds,
      "post",
      (post) => post.id,
      Boolean(filters.communityId),
    );
    return result("posts", posts, posts.map(postToSearchDocument));
  },
};

const SEARCH_PROVIDERS: readonly SearchProvider[] = [
  communitiesProvider,
  businessesProvider,
  professionalsProvider,
  opportunitiesProvider,
  classifiedsProvider,
  eventsProvider,
  postsProvider,
];

export function getSearchProviders(category: SearchFilters["category"] = "all") {
  return SEARCH_PROVIDERS.filter(
    (provider) =>
      provider.isEnabled() &&
      (category === "all" || category === provider.bucket),
  );
}

export function getLinkedEntityTypes(
  providers: readonly SearchProvider[],
): SearchLinkedEntityType[] {
  return Array.from(
    new Set(providers.flatMap((provider) => provider.linkedEntityTypes)),
  );
}

export function isSearchBucketEnabled(bucket: SearchBucket): boolean {
  return SEARCH_PROVIDERS.some(
    (provider) => provider.bucket === bucket && provider.isEnabled(),
  );
}

export function createProviderInput(
  query: string,
  filters: SearchFilters,
  linkedEntityIds: CommunityLinkedEntityIds,
  signal?: AbortSignal,
): SearchProviderInput {
  return { query, filters, linkedEntityIds, signal };
}
