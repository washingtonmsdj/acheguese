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
import type {
  AdminSupabaseClient,
  CityMetadata as AdminCityMetadataRow,
} from "@/core/admin/types/adminDatabase.types";
import { TERRITORY_CONFIG } from "@/core/routing/config/territory";

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

function readString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function readNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" ? value : fallback;
}

function readArray<T>(value: unknown, fallback: T[]): T[] {
  return Array.isArray(value) ? (value as T[]) : fallback;
}

function normalizeCityMetadata(
  row: AdminCityMetadataRow & Record<string, unknown>,
  fallback: CityMetadata,
): CityMetadata {
  return {
    id: readString(row.id) ?? fallback.id,
    city: readString(row.city) ?? fallback.city,
    state: readString(row.state) ?? fallback.state,
    population: readNumber(row.population),
    districts_count: readNumber(row.districts_count),
    active_businesses: readNumber(row.active_businesses),
    schools_count: readNumber(row.schools_count),
    professionals_count: readNumber(row.professionals_count),
    bus_lines_count: readNumber(row.bus_lines_count),
    description: readString(row.description),
    founded_year: typeof row.founded_year === "number" ? row.founded_year : undefined,
    area_km2: typeof row.area_km2 === "number" ? row.area_km2 : undefined,
    updated_at: readString(row.updated_at),
    emergency_contacts: readArray<EmergencyContact>(row.emergency_contacts, []),
    utility_contacts: readArray<UtilityContact>(row.utility_contacts, []),
    tourist_attractions: readArray<TouristAttraction>(row.tourist_attractions, []),
    city_hall_info: (row.city_hall_info as CityHallInfo | undefined) ?? undefined,
    elected_officials:
      (row.elected_officials as ElectedOfficials | undefined) ??
      {
        executive: [],
        legislative: { president: null as never, featured: [], total_councilors: 0 },
      },
    featured_districts: readArray<FeaturedDistrict>(row.featured_districts, []),
    city_status: (row.city_status as CityStatus | null) ?? fallback.city_status,
  };
}

type CityMetadataWriteClient = {
  from(table: "city_metadata"): {
    update(values: Partial<CityMetadata>): {
      eq(column: "id", value: string): Promise<{
        error: { message?: string | null } | null;
      }>;
    };
  };
};

const cityMetadataWriteDb = supabase as unknown as CityMetadataWriteClient;

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

      return normalizeCityMetadata(data as AdminCityMetadataRow & Record<string, unknown>, fallback);
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
      const { error } = await cityMetadataWriteDb
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
