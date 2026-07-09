/**
 * SearchService - SSOT para busca global federada.
 */

import { BusinessService, BusinessUrlService } from "@/core/business";
import { CommunityExperienceService } from "@/core/community-experience/services/CommunityExperienceService";
import type { CommunitySearchResult } from "@/core/community-experience/types";
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
import { buildCommunityPortalUrl } from "@/core/routing/policies";
import { trackError } from "@/shared/utils/errorTracking";
import { logger } from "@/shared/utils/logger";
import type { Business } from "@/core/business/types/Business";
import type { Professional } from "@/core/professional/types";
import type { TerritoryFilter } from "@/core/location/types";

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

const SEARCH_LIMIT = 20;

function shouldSearch(category: SearchCategory, bucket: SearchBucket): boolean {
  return category === "all" || category === bucket;
}

function safeBusinessUrl(business: Business): string | null {
  if (!business.slug || !business.geographic_path) return null;

  try {
    return BusinessUrlService.getCanonicalUrl({
      id: business.profile_id,
      slug: business.slug,
      is_premium: business.is_premium,
      geographic_path: business.geographic_path,
    });
  } catch {
    return null;
  }
}

function truncateDescription(value: string | null | undefined, maxLength = 180): string | null {
  const text = value?.trim();
  if (!text) return null;
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}...` : text;
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
          ? this.searchCommunities(searchTerm)
          : Promise.resolve([]),
        shouldSearch(category, "businesses")
          ? this.searchBusinesses(searchTerm, filters)
          : Promise.resolve([]),
        shouldSearch(category, "professionals")
          ? this.searchProfessionals(searchTerm, filters)
          : Promise.resolve([]),
        shouldSearch(category, "opportunities")
          ? this.searchOpportunities(searchTerm, filters)
          : Promise.resolve([]),
        shouldSearch(category, "classifieds")
          ? this.searchClassifieds(searchTerm, filters)
          : Promise.resolve([]),
        shouldSearch(category, "events")
          ? this.searchEvents(searchTerm, filters)
          : Promise.resolve([]),
        shouldSearch(category, "posts")
          ? this.searchPosts(searchTerm, filters)
          : Promise.resolve([]),
      ]);

      const documents = [
        ...communities.map(this.communityToDocument),
        ...businesses.map(this.businessToDocument),
        ...professionals.map(this.professionalToDocument),
        ...opportunities.map(this.opportunityToDocument),
        ...classifieds.map(this.classifiedToDocument),
        ...events.map(this.eventToDocument),
        ...posts.map(this.postToDocument),
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
      });
    }
  }

  private static async searchCommunities(query: string): Promise<CommunitySearchResult[]> {
    try {
      return CommunityExperienceService.searchPublicCommunities(query, 12);
    } catch (error) {
      logger.error("Error searching communities:", error);
      return [];
    }
  }

  private static async searchBusinesses(query: string, filters: SearchFilters): Promise<Business[]> {
    try {
      const { businesses } = await BusinessService.getBusinessesList({
        searchQuery: query,
        pageSize: SEARCH_LIMIT,
        pageParam: 0,
        filter: filters.territoryFilter,
      });
      return businesses as Business[];
    } catch (error) {
      logger.error("Error searching businesses:", error);
      return [];
    }
  }

  private static async searchProfessionals(
    query: string,
    filters: SearchFilters,
  ): Promise<ProfessionalSearchResult[]> {
    try {
      const results = await ProfessionalService.searchProfessionals(query, {
        city: filters.city,
        neighborhood: filters.neighborhood,
        min_rating: filters.minRating,
        territoryFilter: filters.territoryFilter,
      });
      return (results as Professional[]).map((professional) => ({
        ...professional,
        target_url: ProfessionalUrlService.getCanonicalUrlFromTarget(professional),
      }));
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
  ): Promise<ClassifiedSearchResult[]> {
    try {
      const classifieds = await searchClassifieds(query, {
        filter: filters.territoryFilter,
        limit: SEARCH_LIMIT,
      });

      return classifieds.map((classified) => ({
        ...classified,
        target_url: ClassifiedUrlService.buildPublicUrl(classified),
      }));
    } catch (error) {
      logger.error("Error searching classifieds:", error);
      return [];
    }
  }

  private static async searchEvents(
    query: string,
    filters: SearchFilters,
  ): Promise<EventSearchResult[]> {
    try {
      const page = await eventsReadService.getEventsPage({
        search: query,
        territoryFilter: filters.territoryFilter,
        statuses: ["upcoming", "ongoing"],
        pageSize: SEARCH_LIMIT,
        sortBy: "date",
        sortOrder: "asc",
      });

      return page.items.map((event) => ({
        ...event,
        target_url: eventPublicRoutes.detail(event.id),
      }));
    } catch (error) {
      logger.error("Error searching events:", error);
      return [];
    }
  }

  private static async searchPosts(
    query: string,
    filters: SearchFilters,
  ): Promise<PostSearchResult[]> {
    try {
      const posts = await searchPublicPosts(query, {
        territoryFilter: filters.territoryFilter,
        limit: SEARCH_LIMIT,
      });

      return posts.map((post) => ({
        ...post,
        target_url: null,
      }));
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

  private static communityToDocument(community: CommunitySearchResult): SearchDocument {
    return {
      id: community.id,
      type: "community",
      title: community.name,
      subtitle: "Comunidade",
      description: community.headline ?? community.description,
      url: buildCommunityPortalUrl(community.public_alias ?? community.slug),
      metadata: {
        status: community.status,
        territory_type: community.territory_type,
        territory_id: community.territory_id,
        is_featured: community.is_featured,
      },
    };
  }

  private static businessToDocument(business: Business): SearchDocument {
    return {
      id: business.id,
      type: "business",
      title: business.name,
      subtitle: business.category,
      description: truncateDescription(business.description),
      imageUrl: business.logo_url,
      url: safeBusinessUrl(business),
      territoryLabel: business.location?.name ?? business.business_city ?? business.business_state,
      createdAt: business.created_at,
      metadata: {
        rating: business.rating,
        total_reviews: business.total_reviews,
        is_premium: business.is_premium,
        is_verified: business.is_verified,
      },
    };
  }

  private static professionalToDocument(professional: ProfessionalSearchResult): SearchDocument {
    return {
      id: professional.professional_data_id,
      type: "professional",
      title: professional.name,
      subtitle: professional.category,
      description: truncateDescription(professional.description),
      imageUrl: professional.logo_url,
      url: professional.target_url,
      territoryLabel: professional.neighborhood ?? professional.city,
      createdAt: professional.created_at,
      metadata: {
        rating: professional.rating,
        total_reviews: professional.total_reviews,
        is_verified: professional.is_verified,
        is_accepting_clients: professional.is_accepting_clients,
      },
    };
  }

  private static opportunityToDocument(opportunity: WorkOpportunitySearchResult): SearchDocument {
    return {
      id: opportunity.id,
      type: "opportunity",
      title: opportunity.headline,
      subtitle: opportunity.professional_category,
      description: opportunity.availability_notes,
      url: opportunity.target_url,
      territoryLabel: opportunity.territory_name,
      createdAt: opportunity.published_at ?? opportunity.created_at,
      metadata: {
        opportunity_type: opportunity.opportunity_type,
        urgency: opportunity.urgency,
        professional_id: opportunity.professional_id,
      },
    };
  }

  private static classifiedToDocument(classified: ClassifiedSearchResult): SearchDocument {
    return {
      id: classified.id,
      type: "classified",
      title: classified.title,
      subtitle: classified.category,
      description: truncateDescription(classified.description),
      imageUrl: classified.photos[0] ?? null,
      url: classified.target_url,
      territoryLabel: classified.neighborhood ?? classified.location,
      createdAt: classified.created_at,
      metadata: {
        price: classified.price,
        condition: classified.condition,
        public_id: classified.public_id,
      },
    };
  }

  private static eventToDocument(event: EventSearchResult): SearchDocument {
    return {
      id: event.id,
      type: "event",
      title: event.title,
      subtitle: event.category,
      description: truncateDescription(event.description),
      imageUrl: event.image_url,
      url: event.target_url,
      territoryLabel: event.neighborhood ?? event.city ?? event.location,
      createdAt: event.published_at ?? event.created_at,
      metadata: {
        date: event.date,
        status: event.status,
        is_free: event.is_free,
        current_participants: event.current_participants,
      },
    };
  }

  private static postToDocument(post: PostSearchResult): SearchDocument {
    return {
      id: post.id,
      type: "post",
      title: truncateDescription(post.content, 80) ?? "Post",
      subtitle: post.type,
      description: truncateDescription(post.content),
      imageUrl: post.image_url,
      url: post.target_url,
      territoryLabel: post.location?.name,
      createdAt: post.created_at,
      metadata: {
        likes_count: post.likes_count,
        comments_count: post.comments_count,
        reach: post.reach,
      },
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
