/**
 * CityService - SSOT para operacoes de cidade
 *
 * Responsavel por:
 * - Buscar metadados de cidades
 * - Atualizar metadados (admin)
 * - Gerenciar informacoes de cidade
 *
 * @module city
 */

import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import { trackError } from "@/shared/utils/errorTracking";
import type { AdminSupabaseClient } from "@/core/admin/types/adminDatabase.types";
import { TERRITORY_CONFIG } from "@/config/territory";

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
  city_status?: CityStatus;
}

export type CityStatus = 'active' | 'launching' | 'coming_soon' | 'inactive';

export function resolveFallbackCityStatus(state?: string, city?: string): CityStatus {
  if (!state || !city) return 'coming_soon';
  const isLaunchCity =
    state.toLowerCase() === TERRITORY_CONFIG.launch.state.toLowerCase() &&
    city.toLowerCase() === TERRITORY_CONFIG.launch.city.toLowerCase();
  return isLaunchCity ? 'active' : 'coming_soon';
}

function buildDefaultCityMetadata(state: string, city: string): CityMetadata {
  const normalizedState = state.trim().toUpperCase();
  const normalizedCity = city.trim().toLowerCase();
  const cityTitle = normalizedCity
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

  return {    id: `${normalizedCity}-${normalizedState.toLowerCase()}`,
    city: cityTitle,
    state: normalizedState,
    population: 0,
    districts_count: 0,
    active_businesses: 0,
    schools_count: 0,
    professionals_count: 0,
    bus_lines_count: 0,
    description: `Achegue-se em implantacao em ${cityTitle}.`,
    city_status: resolveFallbackCityStatus(normalizedState, normalizedCity),
  };
}

export class CityService {
  /**
   * Busca metadados de uma cidade
   * ✅ SSOT para city_metadata
   */
  static async getCityMetadata(state: string, city: string): Promise<CityMetadata> {
    const fallback = buildDefaultCityMetadata(state, city);
    try {
      const supabaseTyped = supabase as unknown as AdminSupabaseClient;
      const { data, error } = await supabaseTyped
        .from('city_metadata')
        .select('*')
        .eq('state', state.toLowerCase())
        .eq('city', city.toLowerCase())
        .single();

      if (error) {
        logger.warn('City metadata not found in database, using defaults:', error);
        return fallback;
      }
      if (!data) {
        return fallback;
      }

      const dataAny = data as any;
      return {
        id: dataAny.id,
        city: dataAny.city,
        state: dataAny.state,
        population: dataAny.population ?? 0,
        districts_count: dataAny.districts_count ?? 0,
        active_businesses: dataAny.active_businesses ?? 0,
        schools_count: dataAny.schools_count ?? 0,
        professionals_count: dataAny.professionals_count ?? 0,
        bus_lines_count: dataAny.bus_lines_count ?? 0,
        description: dataAny.description,
        founded_year: dataAny.founded_year,
        area_km2: dataAny.area_km2,
        updated_at: dataAny.updated_at,
        // JSONB fields
        emergency_contacts: dataAny.emergency_contacts ?? [],
        utility_contacts: dataAny.utility_contacts ?? [],
        tourist_attractions: dataAny.tourist_attractions ?? [],
        city_hall_info: dataAny.city_hall_info ?? {},
        elected_officials: dataAny.elected_officials ?? {
          executive: [],
          legislative: { president: null, featured: [], total_councilors: 0 }
        },
        featured_districts: dataAny.featured_districts ?? [],
        city_status: (dataAny.city_status as CityStatus | null) ?? fallback.city_status,
      };
    } catch (err) {
      trackError(err as Error, {
        component: "CityService",
        action: "getCityMetadata",
        metadata: { state, city },
      });
      return fallback;
    }
  }

  /**
   * Busca metadados de uma cidade por ID
   * ✅ SSOT para city_metadata
   */
  static async getCityMetadataById(cityId: string): Promise<CityMetadata | null> {
    try {
      const supabaseTyped = supabase as unknown as AdminSupabaseClient;
      const { data, error } = await supabaseTyped
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
      const cityDb = supabase as any;
      const { error } = await cityDb
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
      const supabaseTyped = supabase as unknown as AdminSupabaseClient;
      const { data, error } = await supabaseTyped
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
