/**
 * ServicesService - Wrapper for Professional Services
 *
 * This service provides a simplified API for the services module
 * by wrapping the core ProfessionalService.
 *
 * Architecture: modules/services → core/professional
 */

import { ProfessionalFacade } from "@/core/professional/services";
import type { TerritoryFilter } from "@/core/location/types";
import type {
  Professional,
  ProfessionalFilters,
} from "@/core/professional/types";

export class ServicesService {
  /**
   * Get all professionals with optional filters
   */
  static async getProfessionals(
    filters?: ProfessionalFilters,
  ): Promise<Professional[]> {
    return ProfessionalFacade.queries.getProfessionals(filters);
  }

  /**
   * Get top rated professionals (limit 5)
   */
  static async getTopRatedProfessionals(options: {
    limit?: number;
    territoryFilter?: TerritoryFilter;
  } = {}): Promise<Professional[]> {
    const { limit = 5, territoryFilter } = options;
    const result = await ProfessionalFacade.queries.getProfessionalsList({
      pageParam: 0,
      category: undefined,
      territory: territoryFilter,
    });
    return result.professionals.slice(0, limit);
  }

  /**
   * Get professional by ID
   */
  static async getProfessionalById(id: string): Promise<Professional> {
    return ProfessionalFacade.queries.getProfessionalById(id);
  }

  /**
   * Search professionals
   */
  static async searchProfessionals(
    query: string,
    filters?: ProfessionalFilters,
  ): Promise<Professional[]> {
    return ProfessionalFacade.queries.searchProfessionals(query, filters);
  }

  /**
   * Increment professional views
   */
  static async incrementViews(professionalId: string): Promise<void> {
    return ProfessionalFacade.mutations.incrementViews(professionalId);
  }
}
