/**
 * SearchService - SSOT para busca global
 *
 * Centraliza todas as buscas do sistema:
 * - Negócios (BusinessService)
 * - Profissionais (ProfessionalService)
 * - Classificados
 * - Eventos
 * - Cupons
 *
 * @version 1.0.0
 */

import { BusinessService } from "@/core/business/services/BusinessService";
import { ProfessionalService } from "@/core/professional/services/ProfessionalService";
import { trackError } from "@/shared/utils/errorTracking";
import { logger } from "@/shared/utils/logger";
import type { Business } from "@/core/business/types/Business";
import type { Professional } from "@/core/professional/types";

// ============================================================================
// TYPES
// ============================================================================

export type SearchCategory =
  | "all"
  | "businesses"
  | "professionals"
  | "classifieds"
  | "events"
  | "coupons";

export interface SearchFilters {
  category?: SearchCategory;
  city?: string;
  neighborhood?: string;
  minRating?: number;
}

export interface SearchResults {
  businesses: any[]; // Simplified for now
  professionals: any[]; // Simplified for now
  classifieds: any[];
  events: any[];
  coupons: any[];
  total: number;
}

// ============================================================================
// SERVICE
// ============================================================================

export class SearchService {
  /**
   * Busca global unificada
   */
  static async search(
    query: string,
    filters: SearchFilters = {},
  ): Promise<SearchResults> {
    try {
      if (!query || query.trim().length < 2) {
        return this.emptyResults();
      }

      const searchTerm = query.trim();
      const { category = "all" } = filters;

      // Buscar em paralelo para melhor performance
      const [businesses, professionals] = await Promise.all([
        category === "all" || category === "businesses"
          ? this.searchBusinesses(searchTerm, filters)
          : Promise.resolve([]),

        category === "all" || category === "professionals"
          ? this.searchProfessionals(searchTerm, filters)
          : Promise.resolve([]),
      ]);

      // TODO: Adicionar busca de classificados, eventos e cupons quando necessário

      return {
        businesses,
        professionals,
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
    }
  }

  /**
   * Buscar negócios
   */
  private static async searchBusinesses(
    query: string,
    filters: SearchFilters,
  ): Promise<any[]> {
    try {
      return await BusinessService.searchBusinessesLegacy(query, 20);
    } catch (error) {
      logger.error("Error searching businesses:", error);
      return [];
    }
  }

  /**
   * Buscar profissionais
   */
  private static async searchProfessionals(
    query: string,
    filters: SearchFilters,
  ): Promise<any[]> {
    try {
      const results = await ProfessionalService.searchProfessionals(query, {
        city: filters.city,
        neighborhood: filters.neighborhood,
        min_rating: filters.minRating,
      });
      return results as any[];
    } catch (error) {
      logger.error("Error searching professionals:", error);
      return [];
    }
  }

  /**
   * Resultados vazios
   */
  private static emptyResults(): SearchResults {
    return {
      businesses: [],
      professionals: [],
      classifieds: [],
      events: [],
      coupons: [],
      total: 0,
    };
  }

  /**
   * Sugestões de busca (histórico + populares)
   */
  static getSearchSuggestions(): string[] {
    // TODO: Implementar histórico de buscas do usuário
    // TODO: Buscar termos mais populares
    return [
      "Restaurantes",
      "Salão de beleza",
      "Encanador",
      "Eletricista",
      "Pizzaria",
      "Academia",
      "Pet shop",
      "Farmácia",
    ];
  }

  /**
   * Salvar busca no histórico
   */
  static saveSearchHistory(query: string): void {
    try {
      const history = this.getSearchHistory();
      const updated = [query, ...history.filter((q) => q !== query)].slice(
        0,
        10,
      );
      localStorage.setItem("search_history", JSON.stringify(updated));
    } catch (error) {
      logger.warn("Failed to save search history:", error);
    }
  }

  /**
   * Obter histórico de buscas
   */
  static getSearchHistory(): string[] {
    try {
      const stored = localStorage.getItem("search_history");
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Limpar histórico
   */
  static clearSearchHistory(): void {
    try {
      localStorage.removeItem("search_history");
    } catch (error) {
      logger.warn("Failed to clear search history:", error);
    }
  }
}

export const searchService = new SearchService();
