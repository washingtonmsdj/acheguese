/**
 * CityService - SSOT para operações de cidade
 * 
 * Responsável por:
 * - Buscar metadados de cidades
 * - Atualizar metadados (admin)
 * - Gerenciar informações de cidade
 * 
 * @module city
 */

import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import { trackError } from "@/shared/utils/errorTracking";

export interface EmergencyContact {
  name: string;
  phone: string;
  icon: string;
  color: string;
}

export interface UtilityContact {
  name: string;
  phone: string;
  type: string;
}

export interface TouristAttraction {
  name: string;
  description: string;
  icon: string;
  featured: boolean;
  category: string;
}

export interface CityHallInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  hours: string;
  social: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
    youtube?: string;
  };
}

export interface ElectedOfficial {
  name: string;
  position?: string;
  party: string;
  term?: string;
  photo_url?: string | null;
}

export interface ElectedOfficials {
  executive: ElectedOfficial[];
  legislative: {
    president: ElectedOfficial;
    featured: ElectedOfficial[];
    total_councilors: number;
  };
}

export interface FeaturedDistrict {
  name: string;
  description: string;
  image_url: string | null;
  residents_count: number;
  posts_count: number;
}

export interface CityMetadata {
  id: string;
  city: string;
  state: string;
  population: number;
  districts_count: number;
  active_businesses: number;
  schools_count: number;
  professionals_count: number;
  bus_lines_count: number;
  description?: string;
  founded_year?: number;
  area_km2?: number;
  updated_at?: string;
  // JSONB fields
  emergency_contacts?: EmergencyContact[];
  utility_contacts?: UtilityContact[];
  tourist_attractions?: TouristAttraction[];
  city_hall_info?: CityHallInfo;
  elected_officials?: ElectedOfficials;
  featured_districts?: FeaturedDistrict[];
}

// Dados padrão para Salvador enquanto não há dados no banco
const SALVADOR_DEFAULT: CityMetadata = {
  id: 'salvador-ba',
  city: 'Salvador',
  state: 'BA',
  population: 2900000,
  districts_count: 163,
  active_businesses: 45000,
  schools_count: 1200,
  professionals_count: 8000,
  bus_lines_count: 450,
  description: 'Primeira capital do Brasil, patrimônio cultural da humanidade.',
  founded_year: 1549,
  area_km2: 693,
};

export class CityService {
  /**
   * Busca metadados de uma cidade
   * ✅ SSOT para city_metadata
   */
  static async getCityMetadata(state: string, city: string): Promise<CityMetadata> {
    try {
      const { data, error } = await supabase
        .from('city_metadata')
        .select('*')
        .eq('state', state.toLowerCase())
        .eq('city', city.toLowerCase())
        .single();

      if (error) {
        logger.warn('City metadata not found in database, using defaults:', error);
        return SALVADOR_DEFAULT;
      }

      return {
        id: data.id,
        city: data.city,
        state: data.state,
        population: data.population ?? SALVADOR_DEFAULT.population,
        districts_count: data.districts_count ?? SALVADOR_DEFAULT.districts_count,
        active_businesses: data.active_businesses ?? SALVADOR_DEFAULT.active_businesses,
        schools_count: data.schools_count ?? SALVADOR_DEFAULT.schools_count,
        professionals_count: data.professionals_count ?? SALVADOR_DEFAULT.professionals_count,
        bus_lines_count: data.bus_lines_count ?? SALVADOR_DEFAULT.bus_lines_count,
        description: data.description,
        founded_year: data.founded_year,
        area_km2: data.area_km2,
        updated_at: data.updated_at,
        // JSONB fields
        emergency_contacts: data.emergency_contacts ?? [],
        utility_contacts: data.utility_contacts ?? [],
        tourist_attractions: data.tourist_attractions ?? [],
        city_hall_info: data.city_hall_info ?? {},
        elected_officials: data.elected_officials ?? { 
          executive: [], 
          legislative: { president: null, featured: [], total_councilors: 0 } 
        },
        featured_districts: data.featured_districts ?? [],
      };
    } catch (err) {
      trackError(err as Error, {
        component: "CityService",
        action: "getCityMetadata",
        metadata: { state, city },
      });
      return SALVADOR_DEFAULT;
    }
  }

  /**
   * Busca metadados de uma cidade por ID
   * ✅ SSOT para city_metadata
   */
  static async getCityMetadataById(cityId: string): Promise<CityMetadata | null> {
    try {
      const { data, error } = await supabase
        .from('city_metadata')
        .select('*')
        .eq('id', cityId)
        .single();

      if (error) {
        logger.error('Error fetching city metadata by ID:', error);
        throw error;
      }

      return data as CityMetadata;
    } catch (err) {
      trackError(err as Error, {
        component: "CityService",
        action: "getCityMetadataById",
        metadata: { cityId },
      });
      return null;
    }
  }

  /**
   * Atualiza metadados de uma cidade (admin)
   * ✅ SSOT para city_metadata updates
   */
  static async updateCityMetadata(
    cityId: string,
    updates: Partial<CityMetadata>
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('city_metadata')
        .update(updates)
        .eq('id', cityId);

      if (error) {
        logger.error('Error updating city metadata:', error);
        throw error;
      }

      logger.info('City metadata updated', { cityId, updates });
    } catch (err) {
      trackError(err as Error, {
        component: "CityService",
        action: "updateCityMetadata",
        metadata: { cityId, updates },
      });
      throw err;
    }
  }

  /**
   * Lista todas as cidades cadastradas
   * ✅ SSOT para city_metadata list
   */
  static async listCities(): Promise<CityMetadata[]> {
    try {
      const { data, error } = await supabase
        .from('city_metadata')
        .select('*')
        .order('city', { ascending: true });

      if (error) {
        logger.error('Error listing cities:', error);
        throw error;
      }

      return data || [];
    } catch (err) {
      trackError(err as Error, {
        component: "CityService",
        action: "listCities",
      });
      return [];
    }
  }
}

// Export singleton
export const cityService = CityService;
