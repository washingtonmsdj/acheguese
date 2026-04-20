/**
 * Landing Types - SSOT v2.0
 * 
 * Tipos compartilhados para landing pages nacionais e estaduais
 */

/**
 * Dados de país
 */
export interface CountryData {
  id: string;
  name: string;
  full_name: string;
  slug: string;
  type: 'country';
  geographic_path: string;
}

/**
 * Dados de estado
 */
export interface StateData {
  id: string;
  name: string;
  full_name: string;
  slug: string;
  type: 'state';
  geographic_path: string;
  metadata: Record<string, any>;
  status?: string;
  city_count: number;
}

/**
 * Dados de cidade
 */
export interface CityData {
  id: string;
  name: string;
  full_name: string;
  slug: string;
  type: 'city';
  geographic_path: string;
  parent_id: string;
  parent_name?: string;
  district_count?: number;
  metadata?: Record<string, any>;
}

/**
 * Dados de grupo territorial
 */
export interface TerritorialGroupData {
  id: string;
  name: string;
  slug: string;
  description?: string;
  anchor_city_id: string;
  anchor_path?: string;
  member_count: number;
}

/**
 * Estatísticas da plataforma
 */
export interface PlatformStats {
  cities: number;
  districts: number;
  businesses: number;
  services: number;
}

/**
 * Empresa verificada
 */
export interface VerifiedBusiness {
  id: string;
  name: string;
  slug: string;
  category: string;
  logo_url?: string;
  is_verified: boolean;
  is_premium: boolean;
  rating: number;
  city_name?: string;
  geographic_path: string;
}
