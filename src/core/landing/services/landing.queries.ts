/**
 * Landing Queries - SSOT
 *
 * Funcoes de leitura para landing pages nacionais e estaduais.
 * Leitura de grupos territoriais pertence a territorialLanding.queries.ts.
 */
import { logger } from '@/shared/utils/logger';
import { supabase } from '@/integrations/supabase';
import {
  isTerritoryVisibleInLanding,
  type TerritoryVisibilityMetadata,
} from '@/core/routing/utils/territoryVisibility';
import { BusinessService } from '@/core/business/services/BusinessService';
import { RoleService } from '@/core/authorization/services/RoleService';
import type {
  CountryData,
  StateData,
  CityData,
  PlatformStats,
  VerifiedBusiness,
  NationalBusiness,
  NationalService,
  NationalClassified,
  NationalStats,
} from './types';
import type { Json } from '@/integrations/supabase';

type ErrorLike = {
  message?: string | null;
};

type LandingQueryPayload<TRow> = {
  count?: number | null;
  data: TRow[] | null;
  error: ErrorLike | null;
};

type LandingQuery<TRow> = PromiseLike<LandingQueryPayload<TRow>> & {
  eq(column: string, value: unknown): LandingQuery<TRow>;
  limit(value: number): LandingQuery<TRow>;
  not(column: string, operator: string, value: unknown): LandingQuery<TRow>;
  order(column: string, options?: { ascending?: boolean }): LandingQuery<TRow>;
  select(columns?: string, options?: { count?: 'exact'; head?: boolean }): LandingQuery<TRow>;
};

type LandingDbClient = {
  from<TRow>(table: string): LandingQuery<TRow>;
};

const landingDb = supabase as unknown as LandingDbClient;

interface LocationRow {
  id: string;
  name: string;
  full_name?: string | null;
  slug: string;
  type: string;
  geographic_path: string;
  parent_id?: string | null;
  metadata?: Json | null;
  status?: string | null;
  parent?: { name?: string | null } | null;
}

function asRecord(value: Json | null | undefined): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function asTerritoryVisibilityMetadata(
  value: Json | null | undefined,
): TerritoryVisibilityMetadata | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as TerritoryVisibilityMetadata;
}

function getLogoUrlFromJson(value: Json | null | undefined): string | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const candidate = (value as { logo_url?: unknown }).logo_url;
  return typeof candidate === 'string' ? candidate : null;
}

async function countPublicServices(): Promise<number> {
  const { count } = await landingDb
    .from<{ id: string }>('professional_data')
    .select('id', { count: 'exact', head: true })
    .eq('is_accepting_clients', true)
    .eq('visibility', 'public_listed');
  return typeof count === 'number' ? count : 0;
}

/** Buscar dados de um pais. */
export async function getCountryData(countryCode: string): Promise<CountryData | null> {
  try {
    const countryPath = `/${countryCode}`;
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .eq('geographic_path', countryPath)
      .eq('type', 'country')
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      logger.error('landing.queries.getCountryData', error);
      throw error;
    }

    return data as CountryData;
  } catch (error) {
    logger.error('landing.queries.getCountryData', error);
    throw error;
  }
}

/** Buscar estados ativos de um pais. */
export async function getActiveStates(countryCode: string): Promise<StateData[]> {
  try {
    const { data: stateRows, error } = await supabase
      .from('locations')
      .select('*')
      .eq('type', 'state')
      .eq('status', 'active')
      .order('name');

    if (error) {
      logger.error('landing.queries.getActiveStates', error);
      throw error;
    }

    const activeStates = ((stateRows || []) as LocationRow[]).filter((state) =>
      isTerritoryVisibleInLanding(asTerritoryVisibilityMetadata(state.metadata)),
    );

    const statesWithCounts: StateData[] = [];
    for (const state of activeStates) {
      const { count } = await supabase
        .from('locations')
        .select('*', { count: 'exact', head: true })
        .eq('parent_id', state.id)
        .eq('type', 'city')
        .eq('status', 'active');

      statesWithCounts.push({
        id: state.id,
        name: state.name,
        full_name: state.full_name || state.name,
        slug: state.slug,
        type: 'state',
        geographic_path: state.geographic_path,
        metadata: asRecord(state.metadata),
        status: state.status,
        city_count: count || 0,
      });
    }

    logger.info('landing.queries.getActiveStates', {
      country: countryCode,
      count: statesWithCounts.length,
    });
    return statesWithCounts;
  } catch (error) {
    logger.error('landing.queries.getActiveStates', error);
    throw error;
  }
}

/** Buscar estado por slug. */
export async function getStateData(countryCode: string, stateSlug: string): Promise<StateData | null> {
  try {
    const statePath = `/${countryCode}/${stateSlug}`;
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .eq('geographic_path', statePath)
      .eq('type', 'state')
      .maybeSingle();

    if (error) {
      logger.error('landing.queries.getStateData', error);
      return null;
    }
    if (!data) return null;

    return {
      id: data.id,
      name: data.name,
      full_name: data.full_name || data.name,
      slug: data.slug,
      type: 'state',
      geographic_path: data.geographic_path,
      metadata: asRecord(data.metadata),
      status: data.status,
      city_count: 0,
    };
  } catch (error) {
    logger.error('landing.queries.getStateData', error);
    return null;
  }
}

/** Buscar cidades ativas de um estado. */
export async function getActiveCitiesByState(stateId: string): Promise<CityData[]> {
  try {
    const { data: cityRows, error } = await supabase
      .from('locations')
      .select('*')
      .eq('parent_id', stateId)
      .eq('type', 'city')
      .eq('status', 'active')
      .order('name');

    if (error) {
      logger.error('landing.queries.getActiveCitiesByState', error);
      return [];
    }

    const activeCities = ((cityRows || []) as LocationRow[]).filter((city) =>
      isTerritoryVisibleInLanding(asTerritoryVisibilityMetadata(city.metadata)),
    );

    return Promise.all(
      activeCities.map(async (city) => {
        const { count } = await supabase
          .from('locations')
          .select('*', { count: 'exact', head: true })
          .eq('parent_id', city.id)
          .eq('type', 'district')
          .eq('status', 'active');

        return {
          id: city.id,
          name: city.name,
          full_name: city.full_name || city.name,
          slug: city.slug,
          type: 'city' as const,
          geographic_path: city.geographic_path,
          parent_id: city.parent_id || '',
          district_count: count || 0,
          metadata: asRecord(city.metadata),
        };
      }),
    );
  } catch (error) {
    logger.error('landing.queries.getActiveCitiesByState', error);
    return [];
  }
}

/** Buscar cidades ativas. */
export async function getActiveCities(): Promise<CityData[]> {
  try {
    const { data, error } = await supabase
      .from('locations')
      .select('*, parent:locations!parent_id(name)')
      .eq('type', 'city')
      .eq('status', 'active')
      .order('name');

    if (error) {
      logger.error('landing.queries.getActiveCities', error);
      throw error;
    }

    const cities = ((data || []) as LocationRow[])
      .filter((city) => isTerritoryVisibleInLanding(asTerritoryVisibilityMetadata(city.metadata)))
      .map((city) => ({
        id: city.id,
        name: city.name,
        full_name: city.full_name || city.name,
        slug: city.slug,
        type: 'city' as const,
        geographic_path: city.geographic_path,
        parent_id: city.parent_id || '',
        parent_name: city.parent?.name,
      }));

    logger.info('landing.queries.getActiveCities', { count: cities.length });
    return cities;
  } catch (error) {
    logger.error('landing.queries.getActiveCities', error);
    throw error;
  }
}

/** Buscar estatisticas da plataforma. */
export async function getPlatformStats(): Promise<PlatformStats> {
  try {
    const { count: citiesCount } = await supabase
      .from('locations')
      .select('*', { count: 'exact', head: true })
      .eq('type', 'city')
      .eq('status', 'active');

    const { count: districtsCount } = await supabase
      .from('locations')
      .select('*', { count: 'exact', head: true })
      .eq('type', 'district')
      .eq('status', 'active');

    const businessesCount = await BusinessService.getTotalBusinessesCount();
    const servicesCount = await countPublicServices();

    const stats = {
      cities: citiesCount || 0,
      districts: districtsCount || 0,
      businesses: businessesCount,
      services: servicesCount,
    };

    logger.info('landing.queries.getPlatformStats', stats);
    return stats;
  } catch (error) {
    logger.error('landing.queries.getPlatformStats', error);
    return { cities: 0, districts: 0, businesses: 0, services: 0 };
  }
}

/** Buscar empresas verificadas. */
export async function getVerifiedBusinesses(limit: number = 6): Promise<VerifiedBusiness[]> {
  try {
    const businesses = await BusinessService.getBusinesses({});
    return businesses
      .filter((business) => business.is_verified || business.is_premium)
      .sort((a, b) => {
        if (a.is_premium !== b.is_premium) return a.is_premium ? -1 : 1;
        return (b.rating || 0) - (a.rating || 0);
      })
      .slice(0, limit)
      .map((business) => ({
        id: business.id,
        name: business.name,
        slug: business.slug || '',
        category: business.category || '',
        logo_url: business.logo_url || undefined,
        is_verified: business.is_verified || false,
        is_premium: business.is_premium || false,
        rating: business.rating || 0,
        city_name: business.business_city || undefined,
        geographic_path: business.geographic_path || '',
      }));
  } catch (error) {
    logger.error('landing.queries.getVerifiedBusinesses', error);
    return [];
  }
}

/** Verificar se usuario tem role de admin. */
export async function checkAdminRole(userId: string): Promise<boolean> {
  try {
    const isAdmin = await RoleService.isAdmin(userId);
    logger.info('landing.queries.checkAdminRole', { userId, isAdmin });
    return isAdmin;
  } catch (error) {
    logger.error('landing.queries.checkAdminRole', error);
    return false;
  }
}

/** Buscar empresas nacionais em destaque. */
export async function getNationalBusinesses(limit: number = 6): Promise<NationalBusiness[]> {
  try {
    const { data, error } = await supabase
      .from('business_data')
      .select('profile_id, business_name, category, metadata, rating, is_premium, is_verified, slug, location:locations!location_id(geographic_path, name)')
      .eq('status', 'active')
      .not('location_id', 'is', null)
      .order('is_premium', { ascending: false })
      .order('rating', { ascending: false })
      .limit(limit);

    if (error) {
      logger.error('landing.queries.getNationalBusinesses', error);
      return [];
    }

    return ((data || []) as Array<{
      profile_id: string;
      business_name: string | null;
      category: string | null;
      metadata?: Json | null;
      rating: number | null;
      is_premium: boolean | null;
      is_verified: boolean | null;
      slug: string | null;
      location?: { geographic_path?: string | null; name?: string | null } | null;
    }>).map((business) => ({
      id: business.profile_id,
      name: business.business_name ?? '',
      category: business.category ?? '',
      logo_url: getLogoUrlFromJson(business.metadata),
      rating: business.rating ?? 0,
      is_premium: business.is_premium ?? false,
      is_verified: business.is_verified ?? false,
      slug: business.slug,
      geographic_path: business.location?.geographic_path,
      city_name: business.location?.name,
    }));
  } catch (error) {
    logger.error('landing.queries.getNationalBusinesses', error);
    return [];
  }
}

/** Buscar servicos nacionais em destaque. */
export async function getNationalServices(limit: number = 6): Promise<NationalService[]> {
  try {
    const { data, error } = await landingDb
      .from<{
        id: string;
        professional_name: string | null;
        service_category: string | null;
        metadata?: Json | null;
        rating: number | null;
        is_verified: boolean | null;
        price_range: string | null;
        location?: { name?: string | null } | null;
      }>('professional_data')
      .select('id, professional_name, service_category, metadata, rating, is_verified, price_range, location:locations!location_id(name)')
      .eq('is_accepting_clients', true)
      .eq('visibility', 'public_listed')
      .not('location_id', 'is', null)
      .order('is_verified', { ascending: false })
      .order('rating', { ascending: false })
      .limit(limit);

    if (error) {
      logger.error('landing.queries.getNationalServices', error);
      return [];
    }

    return ((data || []) as Array<{
      id: string;
      professional_name: string | null;
      service_category: string | null;
      metadata?: Json | null;
      rating: number | null;
      is_verified: boolean | null;
      price_range: string | null;
      location?: { name?: string | null } | null;
    }>).map((service) => ({
      id: service.id,
      name: service.professional_name ?? '',
      category: service.service_category ?? '',
      logo_url: getLogoUrlFromJson(service.metadata),
      rating: service.rating ?? 0,
      is_verified: service.is_verified ?? false,
      price_range: service.price_range ?? 'A combinar',
      city_name: service.location?.name,
    }));
  } catch (error) {
    logger.error('landing.queries.getNationalServices', error);
    return [];
  }
}

/** Buscar classificados nacionais em destaque. */
export async function getNationalClassifieds(limit: number = 6): Promise<NationalClassified[]> {
  try {
    const { getRecentClassifieds } = await import('@/core/classifieds/services');
    const classifieds = await getRecentClassifieds(limit);

    return (classifieds as Array<{
      id: string;
      title?: string | null;
      titulo?: string | null;
      category?: string | null;
      price?: number | null;
      photos?: string[] | null;
      created_at?: string | null;
      public_id?: string | null;
      slug?: string | null;
      geographic_path?: string | null;
      category_slug?: string | null;
      subcategory_slug?: string | null;
    }>).map((classified) => ({
      id: classified.id,
      titulo: classified.title ?? classified.titulo ?? 'Classificado',
      category: classified.category ?? '',
      price: classified.price ?? 0,
      photos: classified.photos ?? [],
      created_at: classified.created_at ?? '',
      public_id: classified.public_id,
      slug: classified.slug,
      geographic_path: classified.geographic_path,
      category_slug: classified.category_slug,
      subcategory_slug: classified.subcategory_slug,
    }));
  } catch (error) {
    logger.error('landing.queries.getNationalClassifieds', error);
    return [];
  }
}

/** Buscar estatisticas nacionais. */
export async function getNationalStats(): Promise<NationalStats> {
  try {
    const { getTotalClassifiedsCount } = await import('@/core/classifieds/services');

    const [bizCount, clsCount, cities, districts, services] = await Promise.allSettled([
      BusinessService.getTotalBusinessesCount(),
      getTotalClassifiedsCount(),
      landingDb.from<{ id: string }>('locations').select('id', { count: 'exact', head: true }).eq('type', 'city').eq('status', 'active'),
      landingDb.from<{ id: string }>('locations').select('id', { count: 'exact', head: true }).eq('type', 'district').eq('status', 'active'),
      landingDb.from<{ id: string }>('professional_data').select('id', { count: 'exact', head: true }).eq('is_accepting_clients', true).eq('visibility', 'public_listed'),
    ]);

    const stats = {
      businesses: bizCount.status === 'fulfilled' ? bizCount.value : 0,
      services: services.status === 'fulfilled' ? (services.value.count ?? 0) : 0,
      classifieds: clsCount.status === 'fulfilled' ? clsCount.value : 0,
      cities: cities.status === 'fulfilled' ? (cities.value.count ?? 0) : 0,
      districts: districts.status === 'fulfilled' ? (districts.value.count ?? 0) : 0,
    };

    logger.info('landing.queries.getNationalStats', stats);
    return stats;
  } catch (error) {
    logger.error('landing.queries.getNationalStats', error);
    return { businesses: 0, services: 0, classifieds: 0, cities: 0, districts: 0 };
  }
}
