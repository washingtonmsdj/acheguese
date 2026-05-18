/**
 * SearchService - SSOT para busca global
 */

import { BusinessService } from "@/core/business/services/BusinessService";
import { ProfessionalService } from "@/core/professional/services/ProfessionalService";
import { supabase } from "@/integrations/supabase";
import { trackError } from "@/shared/utils/errorTracking";
import { logger } from "@/shared/utils/logger";
import { sanitizeForILike } from "@/shared/utils/sqlSanitization";
import type { Business } from "@/core/business/types/Business";
import type { Professional } from "@/core/professional/types";
import type { WorkOpportunityType, WorkOpportunityUrgency } from "@/core/work-opportunities";

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
  opportunity_type: WorkOpportunityType;
  territory_name: string | null;
  urgency: WorkOpportunityUrgency;
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
  professionals: Professional[];
  opportunities: WorkOpportunitySearchResult[];
  classifieds: Record<string, unknown>[];
  events: Record<string, unknown>[];
  coupons: Record<string, unknown>[];
  total: number;
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

      const [businesses, professionals, opportunities, structuredVagas] = await Promise.all([
        category === "all" || category === "businesses"
          ? this.searchBusinesses(searchTerm, filters)
          : Promise.resolve([]),
        category === "all" || category === "professionals"
          ? this.searchProfessionals(searchTerm, filters)
          : Promise.resolve([]),
        category === "all" || category === "opportunities"
          ? this.searchOpportunities(searchTerm, filters)
          : Promise.resolve([]),
        category === "all" || category === "opportunities"
          ? this.searchStructuredVagas(searchTerm, filters)
          : Promise.resolve([]),
      ]);
      const unifiedOpportunities = [...opportunities, ...structuredVagas].sort((a, b) => {
        const dateA = new Date(a.published_at ?? a.created_at ?? 0).getTime();
        const dateB = new Date(b.published_at ?? b.created_at ?? 0).getTime();
        return dateB - dateA;
      });

      return {
        businesses,
        professionals,
        opportunities: unifiedOpportunities,
        classifieds: [],
        events: [],
        coupons: [],
        total: businesses.length + professionals.length + unifiedOpportunities.length,
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
      return (await BusinessService.searchBusinessesLegacy(query, 20)) as Business[];
    } catch (error) {
      logger.error("Error searching businesses:", error);
      return [];
    }
  }

  private static async searchProfessionals(query: string, filters: SearchFilters): Promise<Professional[]> {
    try {
      const results = await ProfessionalService.searchProfessionals(query, {
        city: filters.city,
        neighborhood: filters.neighborhood,
        min_rating: filters.minRating,
      });
      return results as Professional[];
    } catch (error) {
      logger.error("Error searching professionals:", error);
      return [];
    }
  }

  private static async searchOpportunities(
    query: string,
    filters: SearchFilters,
  ): Promise<WorkOpportunitySearchResult[]> {
    const startedAt = this.nowMs();
    try {
      const normalized = sanitizeForILike(query);
      if (!normalized) return [];

      let opportunityQuery = (supabase as any)
        .from("public_work_opportunity_search")
        .select(
          "id, headline, professional_category, opportunity_type, territory_name, urgency, availability_notes, professional_id, professional_name, post_id",
        )
        .order("published_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(20)
        .or(
          [
            `headline.ilike.%${normalized}%`,
            `description.ilike.%${normalized}%`,
            `professional_category.ilike.%${normalized}%`,
            `territory_name.ilike.%${normalized}%`,
            `professional_name.ilike.%${normalized}%`,
            `service_category.ilike.%${normalized}%`,
            `availability_notes.ilike.%${normalized}%`,
          ].join(","),
        );

      if (filters.city) {
        const cityTerm = sanitizeForILike(filters.city);
        if (cityTerm) {
          opportunityQuery = opportunityQuery.ilike("territory_name", `%${cityTerm}%`);
        }
      }

      if (filters.neighborhood) {
        const districtTerm = sanitizeForILike(filters.neighborhood);
        if (districtTerm) {
          opportunityQuery = opportunityQuery.ilike("territory_name", `%${districtTerm}%`);
        }
      }

      const { data, error } = await opportunityQuery;

      if (error) {
        throw new Error(error.message);
      }

      return ((data ?? []) as Array<WorkOpportunitySearchResult>).map((item) => ({
        ...item,
        source_kind: "work_opportunity",
        target_url: `/oportunidades/${item.id}?source=search`,
      }));
    } catch (error) {
      logger.error("Error searching opportunities:", error);
      return [];
    } finally {
      this.logSlowSearch("work-opportunity-search", startedAt, {
        queryLength: query?.trim()?.length ?? 0,
        hasCityFilter: Boolean(filters.city),
        hasNeighborhoodFilter: Boolean(filters.neighborhood),
      });
    }
  }

  private static async searchStructuredVagas(
    query: string,
    filters: SearchFilters,
  ): Promise<WorkOpportunitySearchResult[]> {
    const startedAt = this.nowMs();
    try {
      const normalized = sanitizeForILike(query);
      if (!normalized) return [];

      let vagasQuery = (supabase as any)
        .from("vagas")
        .select("id, titulo, categoria, bairro_nome, urgencia, resumo, empresa_nome, slug, published_at, created_at")
        .limit(20)
        .or(
          [
            `titulo.ilike.%${normalized}%`,
            `descricao.ilike.%${normalized}%`,
            `categoria.ilike.%${normalized}%`,
            `bairro_nome.ilike.%${normalized}%`,
            `empresa_nome.ilike.%${normalized}%`,
          ].join(","),
        )
        .order("published_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false });

      if (filters.city) {
        const cityTerm = sanitizeForILike(filters.city);
        if (cityTerm) {
          vagasQuery = vagasQuery.ilike("bairro_nome", `%${cityTerm}%`);
        }
      }

      if (filters.neighborhood) {
        const districtTerm = sanitizeForILike(filters.neighborhood);
        if (districtTerm) {
          vagasQuery = vagasQuery.ilike("bairro_nome", `%${districtTerm}%`);
        }
      }

      const { data, error } = await vagasQuery;
      if (error) {
        throw new Error(error.message);
      }

      return ((data ?? []) as Array<{
        id: string;
        titulo: string;
        categoria: string | null;
        bairro_nome: string | null;
        urgencia: string | null;
        resumo: string | null;
        empresa_nome: string | null;
        slug: string | null;
        published_at: string | null;
        created_at: string | null;
      }>).map((item) => ({
        id: item.id,
        headline: item.titulo,
        professional_category: item.categoria ?? "vaga",
        opportunity_type: "offering_work",
        territory_name: item.bairro_nome,
        urgency: item.urgencia === "urgente" ? "hoje" : "semana",
        availability_notes: item.resumo,
        professional_id: null,
        professional_name: null,
        post_id: null,
        source_kind: "vaga",
        target_url: `/vagas/detalhe/${item.id}`,
        company_name: item.empresa_nome,
        published_at: item.published_at,
        created_at: item.created_at,
      }));
    } catch (error) {
      logger.error("Error searching structured vagas:", error);
      return [];
    } finally {
      this.logSlowSearch("structured-vagas-search", startedAt, {
        queryLength: query?.trim()?.length ?? 0,
        hasCityFilter: Boolean(filters.city),
        hasNeighborhoodFilter: Boolean(filters.neighborhood),
      });
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


