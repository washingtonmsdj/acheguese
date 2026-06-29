/**
 *  GASTRONOMY QUERIES - SSOT Read Model
 *
 *  Todas as operações de leitura para gastronomia.
 *  Sem side effects, sem mutations.
 *
 */
import { logger } from '@/shared/utils/logger';
import { supabase } from '@/integrations/supabase';
import { BusinessService } from '@/core/business/services/BusinessService';
import { OpeningHoursService } from '@/core/business/services/OpeningHoursService';
import { applyTerritoryFilter } from '@/core/location/utils';
import type { TerritoryFilter } from '@/core/location/types';
import { resolveLocationDescendants } from '@/core/location/utils/resolveLocationDescendants';
import { profileService } from '@/core/profiles/services/ProfileService';
import { sanitizeForILike } from '@/shared/utils/sqlSanitization';
import {
  isValidId,
  isValidTerritoryParams,
} from '@/shared/validation';
import type { BusinessDataWithProfiles } from '@/core/business/types';
import type {
  GastronomyBusiness,
  GastronomyBusinessFilters,
  GastronomyProfile,
} from '../types';

//  ============================================================
//  TIPOS INTERNOS
//  ============================================================

interface TerritorySlugParams {
  state: string;
  city: string;
  district: string;
  slug: string;
}

interface PaginatedGastronomyBusinesses {
  businesses: GastronomyBusiness[];
  nextPage: number | null;
  totalCount: number;
}

type TerritorialFilterQuery = {
  eq: (column: string, value: string) => unknown;
  in: (column: string, values: string[]) => unknown;
};

async function fetchActiveGastronomyProfileByBusinessDataId(
  businessDataId: string,
): Promise<GastronomyProfile | null> {
  const { data, error } = await supabase
    .from('gastronomy_profiles')
    .select('*')
    .eq('business_id', businessDataId)
    .eq('status', 'active')
    .maybeSingle();

  if (error) {
    logger.error('[GastronomyQueries] Error fetching profile by business_data.id:', error);
    return null;
  }

  return data as GastronomyProfile | null;
}

//  ============================================================
//  HELPERS INTERNOS
//  ============================================================

/**
 *  Resolve filtro territorial hierrquico
 */
async function resolveHierarchicalTerritoryFilter(
  territoryFilter?: TerritoryFilter,
): Promise<TerritoryFilter | undefined> {
  if (!territoryFilter) {
    return territoryFilter;
  }

  try {
    return await resolveLocationDescendants(territoryFilter);
  } catch (error) {
    logger.error('[GastronomyQueries] Error resolving territory descendants:', error);
    return territoryFilter;
  }
}

/**
 *  Carrega mapa de perfis
 */
async function loadProfilesMap(profileIds: string[]) {
  if (!profileIds.length) {
    return new Map();
  }

  const profiles = await profileService.getProfilesByIds(profileIds);
  return new Map(profiles.map((profile) => [profile.id, profile]));
}

/**
 *  Build base query para perfis gastronmicos
 */
function buildProfilesQuery(
  filters: GastronomyBusinessFilters = {},
  columns: string = '*',
) {
  let query = supabase
    .from('gastronomy_profiles')
    .select(columns)
    .eq('status', 'active');

  if (filters.cuisine_type) {
    query = query.eq('cuisine_type', filters.cuisine_type);
  }

  if (filters.price_range) {
    query = query.eq('price_range', filters.price_range);
  }

  if (filters.delivery_enabled !== undefined) {
    query = query.eq('delivery_enabled', filters.delivery_enabled);
  }

  if (filters.takeout_enabled !== undefined) {
    query = query.eq('takeout_enabled', filters.takeout_enabled);
  }

  if (filters.dine_in_enabled !== undefined) {
    query = query.eq('dine_in_enabled', filters.dine_in_enabled);
  }

  if (filters.accepts_reservations !== undefined) {
    query = query.eq('accepts_reservations', filters.accepts_reservations);
  }

  if (filters.has_parking !== undefined) {
    query = query.eq('has_parking', filters.has_parking);
  }

  if (filters.has_wifi !== undefined) {
    query = query.eq('has_wifi', filters.has_wifi);
  }

  if (filters.has_accessibility !== undefined) {
    query = query.eq('has_accessibility', filters.has_accessibility);
  }

  return query;
}

/**
 *  Mapeia registro business_data para GastronomyBusiness
 */
async function mapRecordToGastronomyBusiness(
  record: Record<string, unknown> & {
    id: string;
    profile_id: string;
    business_name?: string | null;
    business_role?: string | null;
  },
  params: {
    profilesMap?: Map<string, { id: string; name?: string }>;
    gastronomyProfilesMap?: Map<string, GastronomyProfile>;
  } = {},
): Promise<GastronomyBusiness | null> {
  const profile =
    params.gastronomyProfilesMap?.get(record.id) ??
    (await getGastronomyProfile(record.id));

  if (!profile) {
    return null;
  }

  const hydratedProfilesMap =
    params.profilesMap ??
    (await loadProfilesMap(record.profile_id ? [record.profile_id] : []));

  const business = BusinessService.toBusinessReadModel(({
    ...record,
    profiles: hydratedProfilesMap.get(record.profile_id) || {
      id: record.profile_id,
      name: record.business_name || 'Empresa',
    },
  } as unknown) as BusinessDataWithProfiles);

  return {
    ...business,
    business_data_id: record.id,
    gastronomy_profile: profile,
  };
}

/**
 *  Busca registros de business_data
 */
async function fetchBusinessDataRecords(params: {
  filters?: GastronomyBusinessFilters;
  businessIds?: string[];
  pageParam?: number;
  pageSize?: number;
}) {
  const { filters = {}, businessIds, pageParam, pageSize } = params;

  let effectiveBusinessIds = businessIds;
  if (!effectiveBusinessIds) {
    const { data: gastronomyProfiles, error: profileError } = await buildProfilesQuery(
      filters,
      'business_id',
    );

    if (profileError) {
      logger.error('[GastronomyQueries] Error fetching gastronomy profiles:', profileError);
      return [];
    }

    effectiveBusinessIds = ((gastronomyProfiles || []) as unknown as Array<{ business_id: string }>).map(
      (profile) => profile.business_id,
    );
  }

  if (!effectiveBusinessIds?.length) {
    return [];
  }

  let query = supabase
    .from('business_data')
    .select(`
      * ,
      address:addresses!address_id(*),
      location:locations!location_id(*)
    `)
    .eq('status', 'active')
    .in('id', effectiveBusinessIds)
    .in('business_role', ['standalone', 'branch']);

  const territoryFilter = await resolveHierarchicalTerritoryFilter(filters.territoryFilter);
  if (territoryFilter && territoryFilter.scope !== 'none') {
    applyTerritoryFilter(
      query as unknown as TerritorialFilterQuery,
      territoryFilter,
    );
  }

  if (filters.search) {
    const sanitizedSearch = sanitizeForILike(filters.search);
    if (sanitizedSearch) {
      query = query.or(
        `business_name.ilike.%${sanitizedSearch}%,description.ilike.%${sanitizedSearch}%`,
      );
    }
  }

  query = query.order('is_premium', { ascending: false }).order('rating', { ascending: false });

  if (typeof pageParam === 'number' && typeof pageSize === 'number') {
    query = query.range(pageParam * pageSize, (pageParam + 1) * pageSize - 1);
  }

  const { data, error } = await query;

  if (error) {
    logger.error('[GastronomyQueries] Error fetching business_data:', error);
    return [];
  }

  return data || [];
}

//  ============================================================
//  QUERIES PBLICAS - Gastronomia
//  ============================================================

/**
 *  Buscar perfil gastronmico por business_id
 */
export async function getGastronomyProfile(businessId: string): Promise<GastronomyProfile | null> {
  try {
    if (!isValidId(businessId)) {
      logger.warn('[GastronomyQueries] Invalid business ID provided:', businessId);
      return null;
    }

    const directProfile = await fetchActiveGastronomyProfileByBusinessDataId(businessId);
    if (directProfile) {
      return directProfile;
    }

    //  Compatibilidade: alguns fluxos ainda passam profile_id em vez de business_data.id.
    const resolvedBusinessDataId = await BusinessService.getBusinessDataIdByProfileId(businessId);
    if (!resolvedBusinessDataId || resolvedBusinessDataId === businessId) {
      return null;
    }

    return fetchActiveGastronomyProfileByBusinessDataId(resolvedBusinessDataId);
  } catch (error) {
    logger.error('[GastronomyQueries] Unexpected error fetching profile:', error);
    return null;
  }
}

/**
 *  Buscar negcio gastronmico por slug ou ID
 */
export async function getGastronomyBusiness(identifier: string): Promise<GastronomyBusiness | null> {
  try {
    const normalizedIdentifier = identifier.trim();

    if (!normalizedIdentifier) {
      logger.warn('[GastronomyQueries] Invalid identifier provided:', identifier);
      return null;
    }

    //  Primeiro tentar por slug
    const { data: bySlug, error: slugError } = await supabase
      .from('business_data')
      .select(`
        * ,
        address:addresses!address_id(*),
        location:locations!location_id(*)
      `)
      .eq('status', 'active')
      .in('business_role', ['standalone', 'branch'])
      .eq('slug', normalizedIdentifier)
      .maybeSingle();

    if (slugError) {
      logger.error('[GastronomyQueries] Error resolving business by slug:', slugError);
    }

    if (bySlug) {
      return mapRecordToGastronomyBusiness(bySlug);
    }

    //  Se no for ID vlido, retornar null
    if (!isValidId(normalizedIdentifier)) {
      return null;
    }

    //  Tentar por business_data.id
    const { data: byId, error: idError } = await supabase
      .from('business_data')
      .select(`
        * ,
        address:addresses!address_id(*),
        location:locations!location_id(*)
      `)
      .eq('status', 'active')
      .in('business_role', ['standalone', 'branch'])
      .eq('id', normalizedIdentifier)
      .maybeSingle();

    if (idError || !byId) {
      return null;
    }

    return mapRecordToGastronomyBusiness(byId);
  } catch (error) {
    logger.error('[GastronomyQueries] Unexpected error:', error);
    return null;
  }
}

/**
 *  Buscar negcio gastronmico por slug territorial
 */
export async function getGastronomyBusinessByTerritorySlug(
  params: TerritorySlugParams,
): Promise<GastronomyBusiness | null> {
  try {
    if (!isValidTerritoryParams(params)) {
      logger.warn('[GastronomyQueries] Invalid territory params:', params);
      return null;
    }

    const { state, city, district, slug } = params;
    const geoPath = `/br/${state}/${city}/${district}`;

    //  geographic_path est em locations, no em business_data.
    //  Resolver o location_id primeiro, depois buscar o negcio.
    const { data: locationData, error: locationError } = await supabase
      .from('locations')
      .select('id')
      .eq('geographic_path', geoPath)
      .maybeSingle();

    if (locationError || !locationData) {
      logger.warn('[GastronomyQueries] Location not found for path:', geoPath);
      return null;
    }

    const { data, error } = await supabase
      .from('business_data')
      .select(`
        * ,
        address:addresses!address_id(*),
        location:locations!location_id(*)
      `)
      .eq('status', 'active')
      .in('business_role', ['standalone', 'branch'])
      .eq('slug', slug)
      .eq('location_id', locationData.id)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return mapRecordToGastronomyBusiness(data);
  } catch (error) {
    logger.error('[GastronomyQueries] Error:', error);
    return null;
  }
}

/**
 *  Listar negcios gastronmicos (paginado)
 */
export async function getGastronomyBusinessesList(params: {
  pageParam: number;
  pageSize: number;
  filters: GastronomyBusinessFilters;
}): Promise<PaginatedGastronomyBusinesses> {
  const { pageParam, pageSize, filters } = params;

  try {
    const records = await fetchBusinessDataRecords({
      filters,
      pageParam,
      pageSize,
    });

    if (!records.length) {
      return { businesses: [], nextPage: null, totalCount: 0 };
    }

    //  Carregar todos os perfis gastronmicos de uma vez
    const businessIds = records.map((r) => r.id);
    const { data: profiles } = await supabase
      .from('gastronomy_profiles')
      .select('*')
      .in('business_id', businessIds)
      .eq('status', 'active');

    const profilesMap = new Map(
      (profiles || []).map((p) => [p.business_id, p as GastronomyProfile]),
    );

    //  Carregar todos os perfis de negcio
    const profileIds = records.map((r) => r.profile_id).filter(Boolean) as string[];
    const hydratedProfilesMap = await loadProfilesMap(profileIds);

    //  Mapear para GastronomyBusiness
    const businesses = await Promise.all(
      records.map((record) =>
        mapRecordToGastronomyBusiness(record, {
          profilesMap: hydratedProfilesMap,
          gastronomyProfilesMap: profilesMap,
        }),
      ),
    );

    const validBusinesses = businesses.filter((b): b is GastronomyBusiness => b !== null);

    return {
      businesses: validBusinesses,
      nextPage: validBusinesses.length === pageSize ? pageParam + 1 : null,
      totalCount: validBusinesses.length,
    };
  } catch (error) {
    logger.error('[GastronomyQueries] Error fetching list:', error);
    return { businesses: [], nextPage: null, totalCount: 0 };
  }
}

/**
 *  Buscar negcios por filtros (no paginado)
 */
export async function getGastronomyBusinesses(
  filters: GastronomyBusinessFilters = {},
): Promise<GastronomyBusiness[]> {
  try {
    const records = await fetchBusinessDataRecords({ filters });

    if (!records.length) {
      return [];
    }

    const businessIds = records.map((r) => r.id);
    const { data: profiles } = await supabase
      .from('gastronomy_profiles')
      .select('*')
      .in('business_id', businessIds)
      .eq('status', 'active');

    const profilesMap = new Map(
      (profiles || []).map((p) => [p.business_id, p as GastronomyProfile]),
    );

    const profileIds = records.map((r) => r.profile_id).filter(Boolean) as string[];
    const hydratedProfilesMap = await loadProfilesMap(profileIds);

    const businesses = await Promise.all(
      records.map((record) =>
        mapRecordToGastronomyBusiness(record, {
          profilesMap: hydratedProfilesMap,
          gastronomyProfilesMap: profilesMap,
        }),
      ),
    );

    return businesses.filter((b): b is GastronomyBusiness => b !== null);
  } catch (error) {
    logger.error('[GastronomyQueries] Error:', error);
    return [];
  }
}

/**
 *  Buscar negcios por IDs
 */
export async function getGastronomyBusinessesByIds(businessIds: string[]): Promise<GastronomyBusiness[]> {
  if (!businessIds.length) {
    return [];
  }

  try {
    const validIds = businessIds.filter(isValidId);
    if (!validIds.length) {
      return [];
    }

    const records = await fetchBusinessDataRecords({ businessIds: validIds });

    if (!records.length) {
      return [];
    }

    const resultBusinessIds = records.map((r) => r.id);
    const { data: profiles } = await supabase
      .from('gastronomy_profiles')
      .select('*')
      .in('business_id', resultBusinessIds)
      .eq('status', 'active');

    const profilesMap = new Map(
      (profiles || []).map((p) => [p.business_id, p as GastronomyProfile]),
    );

    const profileIds = records.map((r) => r.profile_id).filter(Boolean) as string[];
    const hydratedProfilesMap = await loadProfilesMap(profileIds);

    const businesses = await Promise.all(
      records.map((record) =>
        mapRecordToGastronomyBusiness(record, {
          profilesMap: hydratedProfilesMap,
          gastronomyProfilesMap: profilesMap,
        }),
      ),
    );

    return businesses.filter((b): b is GastronomyBusiness => b !== null);
  } catch (error) {
    logger.error('[GastronomyQueries] Error:', error);
    return [];
  }
}

/**
 *  Verificar se negcio tem perfil gastronmico
 */
export async function hasGastronomyProfile(businessId: string): Promise<boolean> {
  const profile = await getGastronomyProfile(businessId);
  return profile !== null;
}

//  ============================================================
//  EXPORTS DE TIPOS
//  ============================================================

export type { PaginatedGastronomyBusinesses, TerritorySlugParams };
