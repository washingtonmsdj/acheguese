/**
 * SearchService - SSOT para busca global
 */

import { BusinessService } from "@/core/business/services/BusinessService";
import { ProfessionalService } from "@/core/professional/services/ProfessionalService";
import { ProfessionalUrlService } from "@/core/professional/services/ProfessionalUrlService";
import { trackError } from "@/shared/utils/errorTracking";
import { logger } from "@/shared/utils/logger";
import type { Business } from "@/core/business/types/Business";
import type { Professional } from "@/core/professional/types";

export type SearchCategory =
  | "all"
  | "businesses"
  | "professionals"
  | "opportunities"
  | "classifieds"
  | "events"
  | "coupons";

export interface SearchFilters {
  category?: SearchCategory;
  city?: string;
  neighborhood?: string;
  minRating?: number;
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

export interface SearchResults {
  businesses: Business[];
  professionals: ProfessionalSearchResult[];
  opportunities: WorkOpportunitySearchResult[];
  classifieds: Record<string, unknown>[];
  events: Record<string, unknown>[];
  coupons: Record<string, unknown>[];
  total: number;
}

export type ProfessionalSearchResult = Professional & {
  target_url: string | null;
};

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

      const [businesses, professionals] = await Promise.all([
        category === "all" || category === "businesses"
          ? this.searchBusinesses(searchTerm, filters)
          : Promise.resolve([]),
        category === "all" || category === "professionals"
          ? this.searchProfessionals(searchTerm, filters)
          : Promise.resolve([]),
      ]);

      return {
        businesses,
        professionals,
        opportunities: [],
        classifieds: [],
        events: [],
        coupons: [],
        total: businesses.length + professionals.length,
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

  private static async searchBusinesses(query: string, _filters: SearchFilters): Promise<Business[]> {
    try {
      const { businesses } = await BusinessService.getBusinessesList({
        searchQuery: query,
        pageSize: 20,
        pageParam: 0,
      });
      return businesses as Business[];
    } catch (error) {
      logger.error("Error searching businesses:", error);
      return [];
    }
  }

  private static async searchProfessionals(query: string, filters: SearchFilters): Promise<ProfessionalSearchResult[]> {
    try {
      const results = await ProfessionalService.searchProfessionals(query, {
        city: filters.city,
        neighborhood: filters.neighborhood,
        min_rating: filters.minRating,
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
  private static emptyResults(): SearchResults {
    return {
      businesses: [],
      professionals: [],
      opportunities: [],
      classifieds: [],
      events: [],
      coupons: [],
      total: 0,
    };
  }

  static getSearchSuggestions(): string[] {
    return [
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
