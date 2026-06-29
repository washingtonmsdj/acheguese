/**
 * Landing Queries - SSOT
 * 
 * Funcoes de leitura para landing pages nacionais e estaduais
 */
import { logger } from '@/shared/utils/logger';
import { supabase } from '@/integrations/supabase';
import {
  isTerritoryVisibleInLanding,
  type TerritoryVisibilityMetadata,
} from '@/core/routing/utils/territoryVisibility';
import { BusinessService } from '@/core/business/services/BusinessService';
import { adminRolesService } from '@/core/admin/services/AdminRolesService';
import type {
  CountryData,
  StateData,
  CityData,
  TerritorialGroupData,
  PlatformStats,
  VerifiedBusiness,
  NationalBusiness,
  NationalService,
  NationalClassified,
  NationalStats,
  ActiveTerritoriesWithLanding,
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

interface TerritorialGroupRow {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  anchor_city_id: string;
  metadata?: Json | null;
  anchor_city?: { geographic_path?: string | null } | null;
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

/**
 * Buscar dados de um pais
 */
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

/**
 * Buscar estados ativos de um pais
 */
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

    const activeStates = ((stateRows || []) as LocationRow[]).filter(
      (s) => isTerritoryVisibleInLanding(asTerritoryVisibilityMetadata(s.metadata))
    );

    const statesWithCounts: StateData[] = [];
    for (const st of activeStates) {
      const { count } = await supabase
        .from('locations')
        .select('*', { count: 'exact', head: true })
        .eq('parent_id', st.id)
        .eq('type', 'city')
        .eq('status', 'active');

      statesWithCounts.push({
        id: st.id,
        name: st.name,
        full_name: st.full_name || st.name,
        slug: st.slug,
        type: 'state',
        geographic_path: st.geographic_path,
        metadata: asRecord(st.metadata),
        status: st.status,
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

/**
 * Buscar estado por slug
 */
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

/**
 * Buscar cidades ativas de um estado
 */
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

    const activeCities = ((cityRows || []) as LocationRow[]).filter(
      (city) => isTerritoryVisibleInLanding(asTerritoryVisibilityMetadata(city.metadata)),
    );

    const withCounts = await Promise.all(
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
          parent_id: city.parent_id,
          district_count: count || 0,
          metadata: asRecord(city.metadata),
        };
      }),
    );

    return withCounts;
  } catch (error) {
    logger.error('landing.queries.getActiveCitiesByState', error);
    return [];
  }
}

/**
 * Buscar cidades ativas
 */
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
      .map((c) => ({
        id: c.id,
        name: c.name,
        full_name: c.full_name || c.name,
        slug: c.slug,
        type: 'city' as const,
        geographic_path: c.geographic_path,
        parent_id: c.parent_id,
        parent_name: c.parent?.name,
      }));

    logger.info('landing.queries.getActiveCities', { count: cities.length });

    return cities;
  } catch (error) {
    logger.error('landing.queries.getActiveCities', error);
    throw error;
  }
}

/**
 * Buscar grupos territoriais ativos
 */
export async function getTerritorialGroups(): Promise<TerritorialGroupData[]> {
  try {
    const { data: groups, error: groupError } = await supabase
      .from('territorial_groups')
      .select('*, anchor_city:locations!territorial_groups_anchor_city_id_fkey(geographic_path)')
      .eq('status', 'active');

    if (groupError) {
      logger.error('landing.queries.getTerritorialGroups', groupError);
      return [];
    }

    const { data: members } = await supabase
      .from('territorial_group_members')
      .select('group_id, location_id');

    const countMap: Record<string, number> = {};
    (members || []).forEach((m: { group_id: string }) => {
      countMap[m.group_id] = (countMap[m.group_id] || 0) + 1;
    });

    const groupsData = ((groups || []) as TerritorialGroupRow[])
      .filter((group) => isTerritoryVisibleInLanding(asTerritoryVisibilityMetadata(group.metadata)))
      .map((g) => ({
        id: g.id,
        name: g.name,
        slug: g.slug,
        description: g.description,
        anchor_city_id: g.anchor_city_id,
        anchor_path: g.anchor_city?.geographic_path,
        member_count: countMap[g.id] || 0,
      }));

    logger.info('landing.queries.getTerritorialGroups', { count: groupsData.length });

    return groupsData;
  } catch (error) {
    logger.error('landing.queries.getTerritorialGroups', error);
    return [];
  }
}

/**
 * Buscar estatisticas da plataforma
 */
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
    return {
      cities: 0,
      districts: 0,
      businesses: 0,
      services: 0,
    };
  }
}

/**
 * Buscar empresas verificadas
 */
export async function getVerifiedBusinesses(limit: number = 6): Promise<VerifiedBusiness[]> {
  try {
    const businesses = await BusinessService.getBusinesses({});

    return businesses
      .filter((b) => b.is_verified || b.is_premium)
      .sort((a, b) => {
        if (a.is_premium !== b.is_premium) return a.is_premium ? -1 : 1;
        return (b.rating || 0) - (a.rating || 0);
      })
      .slice(0, limit)
      .map((b) => ({
        id: b.id,
        name: b.name,
        slug: b.slug || '',
        category: b.category || '',
        logo_url: b.logo_url || null,
        is_verified: b.is_verified || false,
        is_premium: b.is_premium || false,
        rating: b.rating || 0,
        city_name: b.business_city || null,
        geographic_path: b.geographic_path || '',
      }));
  } catch (error) {
    logger.error('landing.queries.getVerifiedBusinesses', error);
    return [];
  }
}

/**
 * Verificar se usuario tem role de admin
 */
export async function checkAdminRole(userId: string): Promise<boolean> {
  try {
    const roles = await adminRolesService.getUserRoles(userId);
    const isAdmin = roles.some(
      (r) => ['admin', 'super_admin'].includes(r.role) && r.is_active,
    );

    logger.info('landing.queries.checkAdminRole', { userId, isAdmin });
    return isAdmin;
  } catch (error) {
    logger.error('landing.queries.checkAdminRole', error);
    return false;
  }
}

/**
 * Buscar empresas nacionais em destaque
 */
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
    }>).map((d) => ({
      id: d.profile_id,
      name: d.business_name ?? '',
      category: d.category ?? '',
      logo_url: getLogoUrlFromJson(d.metadata),
      rating: d.rating ?? 0,
      is_premium: d.is_premium ?? false,
      is_verified: d.is_verified ?? false,
      slug: d.slug,
      geographic_path: d.location?.geographic_path,
      city_name: d.location?.name,
    }));
  } catch (error) {
    logger.error('landing.queries.getNationalBusinesses', error);
    return [];
  }
}

/**
 * Buscar servicos nacionais em destaque
 */
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
    }>).map((d) => ({
      id: d.id,
      name: d.professional_name ?? '',
      category: d.service_category ?? '',
      logo_url: getLogoUrlFromJson(d.metadata),
      rating: d.rating ?? 0,
      is_verified: d.is_verified ?? false,
      price_range: d.price_range ?? 'A combinar',
      city_name: d.location?.name,
    }));
  } catch (error) {
    logger.error('landing.queries.getNationalServices', error);
    return [];
  }
}

/**
 * Buscar classificados nacionais em destaque
 */
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
    }>).map((d) => ({
      id: d.id,
      titulo: d.title ?? d.titulo ?? 'Classificado',
      category: d.category ?? '',
      price: d.price ?? 0,
      photos: d.photos ?? [],
      created_at: d.created_at ?? '',
      public_id: d.public_id,
      slug: d.slug,
      geographic_path: d.geographic_path,
      category_slug: d.category_slug,
      subcategory_slug: d.subcategory_slug,
    }));
  } catch (error) {
    logger.error('landing.queries.getNationalClassifieds', error);
    return [];
  }
}

/**
 * Buscar estatisticas nacionais
 */
export async function getNationalStats(): Promise<NationalStats> {
  try {
    const { getTotalClassifiedsCount } = await import('@/core/classifieds/services');

    const [bizCount, clsCount, cities, districts, svc] = await Promise.allSettled([
      BusinessService.getTotalBusinessesCount(),
      getTotalClassifiedsCount(),
      landingDb.from<{ id: string }>('locations').select('id', { count: 'exact', head: true }).eq('type', 'city').eq('status', 'active'),
      landingDb.from<{ id: string }>('locations').select('id', { count: 'exact', head: true }).eq('type', 'district').eq('status', 'active'),
      landingDb.from<{ id: string }>('professional_data').select('id', { count: 'exact', head: true }).eq('is_accepting_clients', true).eq('visibility', 'public_listed'),
    ]);

    const stats = {
      businesses: bizCount.status === 'fulfilled' ? bizCount.value : 0,
      services: svc.status === 'fulfilled' ? (svc.value.count ?? 0) : 0,
      classifieds: clsCount.status === 'fulfilled' ? clsCount.value : 0,
      cities: cities.status === 'fulfilled' ? (cities.value.count ?? 0) : 0,
      districts: districts.status === 'fulfilled' ? (districts.value.count ?? 0) : 0,
    };

    logger.info('landing.queries.getNationalStats', stats);

    return stats;
  } catch (error) {
    logger.error('landing.queries.getNationalStats', error);
    return {
      businesses: 0,
      services: 0,
      classifieds: 0,
      cities: 0,
      districts: 0,
    };
  }
}

/**
 * Buscar territorios ativos com landing habilitada
 */
export async function getActiveTerritoriesWithLanding(): Promise<ActiveTerritoriesWithLanding> {
  try {
    const { data: locs } = await supabase
      .from('locations')
      .select('id, name, slug, type, geographic_path, metadata, parent:locations!parent_id(name)')
      .eq('status', 'active')
      .in('type', ['city', 'district'])
      .order('type')
      .order('name');

    const { data: grps } = await supabase
      .from('territorial_groups')
      .select('id, name, slug, description, metadata, anchor_city:locations!territorial_groups_anchor_city_id_fkey(geographic_path)')
      .eq('status', 'active')
      .order('name');

    const groups: ActiveTerritoriesWithLanding['groups'] = [];
    for (const g of ((grps || []) as TerritorialGroupRow[]).filter((group) =>
      isTerritoryVisibleInLanding(asTerritoryVisibilityMetadata(group.metadata)),
    )) {
      const { count } = await supabase
        .from('territorial_group_members')
        .select('location_id', { count: 'exact', head: true })
        .eq('group_id', g.id);

      groups.push({
        id: g.id,
        name: g.name,
        slug: g.slug,
        description: g.description,
        member_count: count ?? 0,
        anchor_path: g.anchor_city?.geographic_path?.replace(/^\/br/, ''),
      });
    }

    const result = {
      locations: ((locs || []) as LocationRow[])
        .filter((location) =>
          isTerritoryVisibleInLanding(asTerritoryVisibilityMetadata(location.metadata)),
        )
        .map((l) => ({
          id: l.id,
          name: l.name,
          slug: l.slug,
          type: l.type,
          geographic_path: l.geographic_path,
          parent_name: l.parent?.name,
        })),
      groups,
    };

    logger.info('landing.queries.getActiveTerritoriesWithLanding', {
      locations: result.locations.length,
      groups: result.groups.length,
    });

    return result;
  } catch (error) {
    logger.error('landing.queries.getActiveTerritoriesWithLanding', error);
    return {
      locations: [],
      groups: [],
    };
  }
}

