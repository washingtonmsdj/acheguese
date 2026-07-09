/**
 * SearchService - SSOT para busca global federada.
 */

import { BusinessService } from "@/core/business";
import { CommunityEntityLinkService } from "@/core/community-experience/services/CommunityEntityLinkService";
import { CommunityExperienceService } from "@/core/community-experience/services/CommunityExperienceService";
import type {
  CommunityEntityLinkRecord,
  CommunityEntityType,
  CommunitySearchResult,
} from "@/core/community-experience/types";
import {
  ClassifiedUrlService,
  searchClassifieds,
  type ClassifiedData,
} from "@/core/classifieds/services";
import { ProfessionalService } from "@/core/professional/services/ProfessionalService";
import { ProfessionalUrlService } from "@/core/professional/services/ProfessionalUrlService";
import { searchPublicPosts } from "@/core/posts/services";
import type { Post } from "@/core/posts/types";
import { eventsReadService } from "@/core/verticals/events";
import { eventPublicRoutes } from "@/core/verticals/events/routes/eventPublicRoutes";
import type { PublicEvent } from "@/core/verticals/events";
import { WorkOpportunitiesService, type WorkOpportunityCard } from "@/core/work-opportunities";
import { trackError } from "@/shared/utils/errorTracking";
import { logger } from "@/shared/utils/logger";
import type { Business } from "@/core/business/types/Business";
import type { Professional } from "@/core/professional/types";
import type { TerritoryFilter } from "@/core/location/types";
import {
  getCommunitySearchCandidateLimit,
  getCommunitySearchLinkLimit,
  SEARCH_RESULT_LIMITS,
} from "@/core/search/config/searchConfig";
import {
  businessToSearchDocument,
  classifiedToSearchDocument,
  communityToSearchDocument,
  eventToSearchDocument,
  opportunityToSearchDocument,
  postToSearchDocument,
  professionalToSearchDocument,
} from "./SearchDocumentMapper";

export type SearchCategory =
  | "all"
  | "communities"
  | "businesses"
  | "professionals"
  | "opportunities"
  | "classifieds"
  | "events"
  | "posts"
  | "coupons";

export type SearchDocumentType =
  | "community"
  | "business"
  | "professional"
  | "opportunity"
  | "classified"
  | "event"
  | "post"
  | "coupon";

export interface SearchFilters {
  category?: SearchCategory;
  city?: string;
  neighborhood?: string;
  minRating?: number;
  territoryFilter?: TerritoryFilter;
  communityId?: string | null;
}

export interface SearchDocument {
  id: string;
  type: SearchDocumentType;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  url?: string | null;
  territoryLabel?: string | null;
  createdAt?: string | null;
  metadata?: Record<string, unknown>;
}

export interface WorkOpportunitySearchResult {
  id: string;
  headline: string;
  professional_category: string;
  opportunity_type: string;
  territory_name: string | null;
  urgency: string;
  availability_notes: string | null;
  professional_id: string | null;
  professional_name: string | null;
  post_id: string | null;
  source_kind: "work_opportunity" | "vaga";
  target_url: string;
  company_name?: string | null;
  published_at?: string | null;
  created_at?: string | null;
}

export type ProfessionalSearchResult = Professional & {
  target_url: string | null;
};

export type ClassifiedSearchResult = ClassifiedData & {
  target_url: string | null;
};

export type EventSearchResult = PublicEvent & {
  target_url: string;
};

export type PostSearchResult = Post & {
  target_url: string | null;
};

export interface SearchResults {
  documents: SearchDocument[];
  communities: CommunitySearchResult[];
  businesses: Business[];
  professionals: ProfessionalSearchResult[];
  opportunities: WorkOpportunitySearchResult[];
  classifieds: ClassifiedSearchResult[];
  events: EventSearchResult[];
  posts: PostSearchResult[];
  coupons: Record<string, unknown>[];
  total: number;
}

type SearchBucket = Exclude<SearchCategory, "all" | "coupons">;
type SearchLinkedEntityType = Extract<
  CommunityEntityType,
  "business" | "professional" | "classified" | "event" | "post"
>;
type CommunityLinkedEntityIds = Partial<Record<SearchLinkedEntityType, ReadonlySet<string>>>;

const SEARCH_LIMIT = SEARCH_RESULT_LIMITS.DEFAULT;
const SEARCH_LINKED_ENTITY_TYPES_BY_BUCKET: Record<SearchBucket, readonly SearchLinkedEntityType[]> = {
  communities: [],
  businesses: ["business"],
  professionals: ["professional"],
  opportunities: [],
  classifieds: ["classified"],
  events: ["event"],
  posts: ["post"],
};

function shouldSearch(category: SearchCategory, bucket: SearchBucket): boolean {
  return category === "all" || category === bucket;
}

function getLinkedEntityTypesForCategory(category: SearchCategory): SearchLinkedEntityType[] {
  if (category === "all") {
    return Array.from(
      new Set(
        Object.values(SEARCH_LINKED_ENTITY_TYPES_BY_BUCKET)
          .flat(),
      ),
    );
  }

  if (category === "coupons") return [];
  return [...SEARCH_LINKED_ENTITY_TYPES_BY_BUCKET[category]];
}

function toLinkedEntityIdSet(
  links: readonly CommunityEntityLinkRecord[],
): CommunityLinkedEntityIds {
  const grouped: Partial<Record<SearchLinkedEntityType, Set<string>>> = {};

  links.forEach((link) => {
    if (!getLinkedEntityTypesForCategory("all").includes(link.entity_type as SearchLinkedEntityType)) {
      return;
    }

    const entityType = link.entity_type as SearchLinkedEntityType;
    grouped[entityType] ??= new Set<string>();
    grouped[entityType]?.add(link.entity_id);
  });

  return grouped;
}

function filterByLinkedEntityIds<T>(
  items: readonly T[],
  linkedIds: CommunityLinkedEntityIds,
  entityType: SearchLinkedEntityType,
  getEntityId: (item: T) => string | null | undefined,
): T[] {
  const ids = linkedIds[entityType];
  const filtered = ids?.size
    ? items.filter((item) => {
        const entityId = getEntityId(item);
        return Boolean(entityId && ids.has(entityId));
      })
    : [...items];

  return filtered.slice(0, SEARCH_LIMIT);
}

export class SearchService {
  private static readonly SLOW_SEARCH_THRESHOLD_MS = 450;

  private static nowMs(): number {
    if (typeof performance !== "undefined" && typeof performance.now === "function") {
      return performance.now();
    }
    return Date.now();
  }

  private static logSlowSearch(scope: string, startedAt: number, metadata?: Record<string, unknown>): void {
    const elapsed = this.nowMs() - startedAt;
    if (elapsed < this.SLOW_SEARCH_THRESHOLD_MS) return;
    logger.warn(`[SearchService] Slow ${scope}: ${Math.round(elapsed)}ms`, metadata);
  }

  static async search(query: string, filters: SearchFilters = {}): Promise<SearchResults> {
    const startedAt = this.nowMs();
    try {
      if (!query || query.trim().length < 2) {
        return this.emptyResults();
      }

      const searchTerm = query.trim();
      const { category = "all" } = filters;
      const linkedEntityIds = await this.getCommunityLinkedEntityIds(filters.communityId, category);

      const [
        communities,
        businesses,
        professionals,
        opportunities,
        classifieds,
        events,
        posts,
      ] = await Promise.all([
        shouldSearch(category, "communities")
          ? this.searchCommunities(searchTerm, filters)
          : Promise.resolve([]),
        shouldSearch(category, "businesses")
          ? this.searchBusinesses(searchTerm, filters, linkedEntityIds)
          : Promise.resolve([]),
        shouldSearch(category, "professionals")
          ? this.searchProfessionals(searchTerm, filters, linkedEntityIds)
          : Promise.resolve([]),
        shouldSearch(category, "opportunities")
          ? this.searchOpportunities(searchTerm, filters)
          : Promise.resolve([]),
        shouldSearch(category, "classifieds")
          ? this.searchClassifieds(searchTerm, filters, linkedEntityIds)
          : Promise.resolve([]),
        shouldSearch(category, "events")
          ? this.searchEvents(searchTerm, filters, linkedEntityIds)
          : Promise.resolve([]),
        shouldSearch(category, "posts")
          ? this.searchPosts(searchTerm, filters, linkedEntityIds)
          : Promise.resolve([]),
      ]);

      const documents = [
        ...communities.map(communityToSearchDocument),
        ...businesses.map(businessToSearchDocument),
        ...professionals.map(professionalToSearchDocument),
        ...opportunities.map(opportunityToSearchDocument),
        ...classifieds.map(classifiedToSearchDocument),
        ...events.map(eventToSearchDocument),
        ...posts.map(postToSearchDocument),
      ];

      return {
        documents,
        communities,
        businesses,
        professionals,
        opportunities,
        classifieds,
        events,
        posts,
        coupons: [],
        total: documents.length,
      };
    } catch (error) {
      trackError(error as Error, {
        component: "SearchService",
        action: "search",
        metadata: { query, filters },
      });
      return this.emptyResults();
    } finally {
      this.logSlowSearch("global-search", startedAt, {
        queryLength: query?.trim()?.length ?? 0,
        category: filters.category ?? "all",
        hasCommunityScope: Boolean(filters.communityId),
      });
    }
  }

  private static async getCommunityLinkedEntityIds(
    communityId: string | null | undefined,
    category: SearchCategory,
  ): Promise<CommunityLinkedEntityIds> {
    if (!communityId) return {};

    const entityTypes = getLinkedEntityTypesForCategory(category);
    if (entityTypes.length === 0) return {};

    try {
      const links = await CommunityEntityLinkService.listActiveByCommunity(communityId, {
        entityTypes,
        limit: getCommunitySearchLinkLimit(),
      });

      return toLinkedEntityIdSet(links);
    } catch (error) {
      logger.warn("SearchService.communityEntityLinks", error);
      return {};
    }
  }

  private static async searchCommunities(
    query: string,
    filters: SearchFilters,
  ): Promise<CommunitySearchResult[]> {
    try {
      const communities = await CommunityExperienceService.searchPublicCommunities(query, 12);
      if (!filters.communityId) return communities;
      return communities.filter((community) => community.id === filters.communityId);
    } catch (error) {
      logger.error("Error searching communities:", error);
      return [];
    }
  }

  private static getDomainSearchLimit(filters: SearchFilters): number {
    return filters.communityId ? getCommunitySearchCandidateLimit() : SEARCH_LIMIT;
  }

  private static async searchBusinesses(
    query: string,
    filters: SearchFilters,
    linkedEntityIds: CommunityLinkedEntityIds,
  ): Promise<Business[]> {
    try {
      const { businesses } = await BusinessService.getBusinessesList({
        searchQuery: query,
        pageSize: this.getDomainSearchLimit(filters),
        pageParam: 0,
        filter: filters.territoryFilter,
      });
      return filterByLinkedEntityIds(
        businesses as Business[],
        linkedEntityIds,
        "business",
        (business) => business.id,
      );
    } catch (error) {
      logger.error("Error searching businesses:", error);
      return [];
    }
  }

  private static async searchProfessionals(
    query: string,
    filters: SearchFilters,
    linkedEntityIds: CommunityLinkedEntityIds,
  ): Promise<ProfessionalSearchResult[]> {
    try {
      const results = await ProfessionalService.searchProfessionals(query, {
        city: filters.city,
        neighborhood: filters.neighborhood,
        min_rating: filters.minRating,
        territoryFilter: filters.territoryFilter,
      });
      const professionals = (results as Professional[]).map((professional) => ({
        ...professional,
        target_url: ProfessionalUrlService.getCanonicalUrlFromTarget(professional),
      }));

      return filterByLinkedEntityIds(
        professionals,
        linkedEntityIds,
        "professional",
        (professional) => professional.professional_data_id,
      );
    } catch (error) {
      logger.error("Error searching professionals:", error);
      return [];
    }
  }

  private static async searchOpportunities(
    query: string,
    filters: SearchFilters,
  ): Promise<WorkOpportunitySearchResult[]> {
    try {
      const cards = await WorkOpportunitiesService.listPublicOpportunityCards({
        search: query,
        territoryLocationId:
          filters.territoryFilter?.scope === "location"
            ? filters.territoryFilter.location_id
            : undefined,
        limit: SEARCH_LIMIT,
      });

      return cards.map((card) => this.toWorkOpportunitySearchResult(card));
    } catch (error) {
      logger.error("Error searching opportunities:", error);
      return [];
    }
  }

  private static async searchClassifieds(
    query: string,
    filters: SearchFilters,
    linkedEntityIds: CommunityLinkedEntityIds,
  ): Promise<ClassifiedSearchResult[]> {
    try {
      const classifieds = await searchClassifieds(query, {
        filter: filters.territoryFilter,
        limit: this.getDomainSearchLimit(filters),
      });

      const results = classifieds.map((classified) => ({
        ...classified,
        target_url: ClassifiedUrlService.buildPublicUrl(classified),
      }));

      return filterByLinkedEntityIds(
        results,
        linkedEntityIds,
        "classified",
        (classified) => classified.id,
      );
    } catch (error) {
      logger.error("Error searching classifieds:", error);
      return [];
    }
  }

  private static async searchEvents(
    query: string,
    filters: SearchFilters,
    linkedEntityIds: CommunityLinkedEntityIds,
  ): Promise<EventSearchResult[]> {
    try {
      const page = await eventsReadService.getEventsPage({
        search: query,
        territoryFilter: filters.territoryFilter,
        statuses: ["upcoming", "ongoing"],
        pageSize: this.getDomainSearchLimit(filters),
        sortBy: "date",
        sortOrder: "asc",
      });

      const results = page.items.map((event) => ({
        ...event,
        target_url: eventPublicRoutes.detail(event.id),
      }));

      return filterByLinkedEntityIds(
        results,
        linkedEntityIds,
        "event",
        (event) => event.id,
      );
    } catch (error) {
      logger.error("Error searching events:", error);
      return [];
    }
  }

  private static async searchPosts(
    query: string,
    filters: SearchFilters,
    linkedEntityIds: CommunityLinkedEntityIds,
  ): Promise<PostSearchResult[]> {
    try {
      const posts = await searchPublicPosts(query, {
        territoryFilter: filters.territoryFilter,
        limit: this.getDomainSearchLimit(filters),
      });

      const results = posts.map((post) => ({
        ...post,
        target_url: null,
      }));

      return filterByLinkedEntityIds(
        results,
        linkedEntityIds,
        "post",
        (post) => post.id,
      );
    } catch (error) {
      logger.error("Error searching posts:", error);
      return [];
    }
  }

  private static toWorkOpportunitySearchResult(
    card: WorkOpportunityCard,
  ): WorkOpportunitySearchResult {
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

  private static emptyResults(): SearchResults {
    return {
      documents: [],
      communities: [],
      businesses: [],
      professionals: [],
      opportunities: [],
      classifieds: [],
      events: [],
      posts: [],
      coupons: [],
      total: 0,
    };
  }

  static getSearchSuggestions(): string[] {
    return [
      "comunidade pituba",
      "eventos hoje",
      "classificados bicicleta",
      "pedreiro pituba",
      "pizzaiolo",
      "eletricista amaralina",
      "restaurantes",
      "salao de beleza",
      "encanador",
      "pet shop",
      "farmacia",
    ];
  }

  static saveSearchHistory(query: string): void {
    try {
      const history = this.getSearchHistory();
      const updated = [query, ...history.filter((q) => q !== query)].slice(0, 10);
      localStorage.setItem("search_history", JSON.stringify(updated));
    } catch (error) {
      logger.warn("Failed to save search history:", error);
    }
  }

  static getSearchHistory(): string[] {
    try {
      const stored = localStorage.getItem("search_history");
      return stored ? JSON.parse(stored) : [];
    } catch (_error) {
      return [];
    }
  }

  static clearSearchHistory(): void {
    try {
      localStorage.removeItem("search_history");
    } catch (error) {
      logger.warn("Failed to clear search history:", error);
    }
  }
}

export const searchService = new SearchService();
