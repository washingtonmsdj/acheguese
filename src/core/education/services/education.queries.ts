/**
 * Education Queries - SSOT Read Model
 *
 * Todas as operacoes de leitura para o modulo Education.
 * Sem side effects, sem mutations.
 *
 * @version 1.0.0
 */

import { supabase } from '@/integrations/supabase';
import { CommunityExperienceService } from '@/core/community-experience/services/CommunityExperienceService';
import { territorialGroupService } from '@/core/territorial';
import { logger } from '@/shared/utils/logger';
import { getRecordValue } from '@/shared/utils/recordLookup';
import type {
  EducationPublicProfile,
  EducationPublicRoute,
  EducationProfile,
  EducationProgram,
  EducationLead,
  EducationLeadEvent,
  EducationEvent,
} from '../types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidUuid(value?: string | null): value is string {
  return Boolean(value && UUID_REGEX.test(value));
}

function educationQueryError(operation: string, error: { message: string }): never {
  logger.error(`[EducationQueries] ${operation}:`, error);
  throw new Error(error.message);
}

// ============================================================
// TIPOS INTERNOS
// ============================================================

export interface TerritorySlugParams {
  state: string;
  city: string;
  district: string;
  slug: string;
}

export interface PaginatedEducationProfiles {
  profiles: EducationPublicProfile[];
  nextPage: number | null;
  totalCount: number;
}

interface BusinessRouteRow {
  id: string;
  profile_id: string;
  business_name: string | null;
  slug: string | null;
  is_claimable: boolean;
  location: { geographic_path?: string | null } | null;
}

interface EducationTerritoryFilter {
  state?: string;
  city?: string;
  district?: string;
}

interface LocationRouteRow {
  id: string;
  geographic_path: string | null;
}

function parseEducationPublicRoute(
  geographicPath?: string | null,
  slug?: string | null,
): EducationPublicRoute | null {
  if (!geographicPath || !slug) return null;

  const parts = geographicPath.split('/').filter(Boolean);
  const [country, state, city, district] = parts;

  if (country !== 'br' || !state || !city || !district) {
    return null;
  }

  return {
    state,
    city,
    district,
    slug,
    geographic_path: geographicPath,
  };
}

async function enrichEducationProfilesWithPublicRoutes(
  profiles: EducationProfile[],
  routeRows?: BusinessRouteRow[],
): Promise<EducationPublicProfile[]> {
  if (profiles.length === 0) return [];

  const profileIds = Array.from(new Set(profiles.map((profile) => profile.business_id)));
  const knownRoutes = routeRows?.filter((row) => profileIds.includes(row.profile_id));
  const data = knownRoutes ?? [];

  if (!knownRoutes) {
    const result = await supabase
      .from('public_business_search')
      .select('id, profile_id, business_name, slug, is_claimable, location:locations!location_id(geographic_path)')
      .in('profile_id', profileIds)
      .eq('status', 'active')
      .in('business_role', ['standalone', 'branch']);

    if (result.error) {
      logger.error('[EducationQueries] Error fetching public routes:', result.error);
      return profiles.map((profile) => ({
        ...profile,
        business_data_id: null,
        business_name: null,
        is_claimable: false,
        public_route: null,
      }));
    }

    data.push(...((result.data ?? []) as unknown as BusinessRouteRow[]));
  }

  const routeByProfileId = new Map<string, BusinessRouteRow>();
  ((data ?? []) as unknown as BusinessRouteRow[]).forEach((row) => {
    if (!routeByProfileId.has(row.profile_id)) {
      routeByProfileId.set(row.profile_id, row);
    }
  });

  return profiles.map((profile) => {
    const business = routeByProfileId.get(profile.business_id);
    return {
      ...profile,
      business_data_id: business?.id ?? null,
      business_name: business?.business_name ?? null,
      is_claimable: business?.is_claimable ?? false,
      public_route: parseEducationPublicRoute(
        business?.location?.geographic_path,
        business?.slug,
      ),
    };
  });
}

async function resolveEducationTerritoryLocationIds(
  territory: EducationTerritoryFilter,
): Promise<string[]> {
  const { state, city, district } = territory;
  if (!state || !city) return [];

  const cityPath = `/br/${state}/${city}`;

  if (!district) {
    const { data, error } = await supabase
      .from('locations')
      .select('id, geographic_path')
      .or(`geographic_path.eq.${cityPath},geographic_path.like.${cityPath}/%`);

    if (error) {
      logger.error('[EducationQueries] Error fetching city education locations:', error);
      return [];
    }

    return ((data ?? []) as LocationRouteRow[]).map((location) => location.id);
  }

  const { data: cityLocation, error: cityError } = await supabase
    .from('locations')
    .select('id')
    .eq('geographic_path', cityPath)
    .maybeSingle();

  if (cityError) {
    logger.error('[EducationQueries] Error fetching city location:', cityError);
    return [];
  }

  if (cityLocation?.id) {
    const resolvedCommunity = await CommunityExperienceService.findCommunityByCityAndSlug(
      cityLocation.id,
      district,
    );
    const isLocationCommunity =
      resolvedCommunity?.territory_type === 'neighborhood' ||
      resolvedCommunity?.territory_type === 'district';

    if (resolvedCommunity?.territory_id && isLocationCommunity) {
      return [resolvedCommunity.territory_id];
    }

    if (
      resolvedCommunity?.territory_type === 'territorial_group' &&
      resolvedCommunity.territory_id
    ) {
      try {
        return await territorialGroupService.resolveGroupToLocationIds(
          resolvedCommunity.territory_id,
        );
      } catch (error) {
        logger.error('[EducationQueries] Error resolving territorial group members:', error);
        return [];
      }
    }
  }

  const { data, error } = await supabase
    .from('locations')
    .select('id')
    .eq('geographic_path', `${cityPath}/${district}`);

  if (error) {
    logger.error('[EducationQueries] Error fetching district education location:', error);
    return [];
  }

  return (data ?? []).map((location) => location.id);
}

async function listEducationBusinessRoutesByTerritory(
  territory: EducationTerritoryFilter,
): Promise<BusinessRouteRow[]> {
  const { state, city, district } = territory;
  if (!state || !city) return [];

  const locationIds = await resolveEducationTerritoryLocationIds({ state, city, district });
  if (locationIds.length === 0) return [];

  const { data, error } = await supabase
    .from('public_business_search')
    .select('id, profile_id, business_name, slug, is_claimable, location:locations!location_id(geographic_path)')
    .in('location_id', locationIds)
    .eq('status', 'active')
    .in('business_role', ['standalone', 'branch'])
    .eq('category', 'educacao');

  if (error) {
    logger.error('[EducationQueries] Error fetching education business routes:', error);
    return [];
  }

  return (data ?? []) as unknown as BusinessRouteRow[];
}

// ============================================================
// PROFILES
// ============================================================

/**
 * Busca perfil de educacao por ID
 */
export async function getEducationProfileById(
  id: string,
): Promise<EducationProfile | null> {
  const { data, error } = await supabase
    .from('education_profiles')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    educationQueryError('Error fetching profile by id', error);
  }

  return data as EducationProfile | null;
}

/**
 * Busca perfil de educacao por business_id
 */
export async function getEducationProfileByBusinessId(
  businessId: string,
): Promise<EducationProfile | null> {
  const { data, error } = await supabase
    .from('education_profiles')
    .select('*')
    .eq('business_id', businessId)
    .maybeSingle();

  if (error) {
    educationQueryError('Error fetching profile by business_id', error);
  }

  return data as EducationProfile | null;
}

/**
 * Lista perfis publicados com paginacao
 */
export async function listPublishedEducationProfiles(
  options: {
    page?: number;
    pageSize?: number;
    nicheKey?: string;
    state?: string;
    city?: string;
    district?: string;
  } = {},
): Promise<PaginatedEducationProfiles> {
  const { page = 1, pageSize = 20, nicheKey, state, city, district } = options;
  const hasTerritoryFilter = Boolean(state && city);
  const routeRows = hasTerritoryFilter
    ? await listEducationBusinessRoutesByTerritory({ state, city, district })
    : undefined;

  if (hasTerritoryFilter && (!routeRows || routeRows.length === 0)) {
    return { profiles: [], nextPage: null, totalCount: 0 };
  }

  let query = supabase
    .from('education_profiles')
    .select('*', { count: 'exact' })
    .eq('status', 'published');

  if (nicheKey) {
    query = query.eq('niche_key', nicheKey);
  }

  if (routeRows) {
    query = query.in('business_id', routeRows.map((row) => row.profile_id));
  }

  const { data, error, count } = await query
    .order('published_at', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (error) {
    logger.error('[EducationQueries] Error listing published profiles:', error);
    return { profiles: [], nextPage: null, totalCount: 0 };
  }

  const totalCount = count ?? 0;
  const hasMore = page * pageSize < totalCount;

  return {
    profiles: await enrichEducationProfilesWithPublicRoutes(
      (data ?? []) as EducationProfile[],
      routeRows,
    ),
    nextPage: hasMore ? page + 1 : null,
    totalCount,
  };
}

// ============================================================
// PROGRAMS
// ============================================================

/**
 * Lista programas de um perfil
 */
export async function listEducationPrograms(
  profileId: string,
  options: {
    isActive?: boolean;
  } = {},
): Promise<EducationProgram[]> {
  let query = supabase
    .from('education_programs')
    .select('*')
    .eq('education_profile_id', profileId);

  if (options.isActive !== undefined) {
    query = query.eq('is_active', options.isActive);
  }

  const { data, error } = await query
    .order('display_order', { ascending: true });

  if (error) {
    educationQueryError('Error listing programs', error);
  }

  return (data ?? []) as EducationProgram[];
}

/**
 * Busca programa por ID
 */
export async function getEducationProgramById(
  id: string,
): Promise<EducationProgram | null> {
  const { data, error } = await supabase
    .from('education_programs')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    educationQueryError('Error fetching program by id', error);
  }

  return data as EducationProgram | null;
}

// ============================================================
// LEADS
// ============================================================

/**
 * Lista leads de um perfil
 */
export async function listEducationLeads(
  profileId: string,
  options: {
    status?: string;
    page?: number;
    pageSize?: number;
  } = {},
): Promise<{ leads: EducationLead[]; totalCount: number }> {
  if (!isValidUuid(profileId)) {
    return { leads: [], totalCount: 0 };
  }
  const { status, page = 1, pageSize = 25 } = options;

  let query = supabase
    .from('education_leads')
    .select('*', { count: 'exact' })
    .eq('education_profile_id', profileId);

  if (status) {
    query = query.eq('status', status as NonNullable<EducationLead['status']>);
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (error) {
    educationQueryError('Error listing leads', error);
  }

  return {
    leads: (data ?? []) as EducationLead[],
    totalCount: count ?? 0,
  };
}

/**
 * Busca lead por ID
 */
export async function getEducationLeadById(
  id: string,
): Promise<EducationLead | null> {
  const { data, error } = await supabase
    .from('education_leads')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    educationQueryError('Error fetching lead by id', error);
  }

  return data as EducationLead | null;
}

/**
 * Lista eventos de auditoria de um lead
 */
export async function listLeadEvents(
  leadId: string,
): Promise<EducationLeadEvent[]> {
  const { data, error } = await supabase
    .from('education_lead_events')
    .select('*')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false });

  if (error) {
    educationQueryError('Error listing lead events', error);
  }

  return (data ?? []) as EducationLeadEvent[];
}

// ============================================================
// EVENTS
// ============================================================

/**
 * Lista eventos de um perfil
 */
export async function listEducationEvents(
  profileId: string,
  options: {
    isPublic?: boolean;
    upcoming?: boolean;
  } = {},
): Promise<EducationEvent[]> {
  let query = supabase
    .from('education_events')
    .select('*')
    .eq('education_profile_id', profileId);

  if (options.isPublic !== undefined) {
    query = query.eq('is_public', options.isPublic);
  }

  if (options.upcoming) {
    query = query.gte('starts_at', new Date().toISOString());
  }

  const { data, error } = await query
    .order('starts_at', { ascending: true });

  if (error) {
    educationQueryError('Error listing events', error);
  }

  return (data ?? []) as EducationEvent[];
}

/**
 * Busca evento por ID
 */
export async function getEducationEventById(
  id: string,
): Promise<EducationEvent | null> {
  const { data, error } = await supabase
    .from('education_events')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    educationQueryError('Error fetching event by id', error);
  }

  return data as EducationEvent | null;
}

// ============================================================
// ANALYTICS QUERIES (Regular School Metrics)
// ============================================================

export interface LeadStatusCounts {
  total: number;
  new: number;
  contacted: number;
  visit_scheduled: number;
  proposal_sent: number;
  enrolled: number;
  lost: number;
}

function incrementLeadStatusCount(counts: LeadStatusCounts, status: keyof LeadStatusCounts): void {
  switch (status) {
    case 'new':
      counts.new += 1;
      return;
    case 'contacted':
      counts.contacted += 1;
      return;
    case 'visit_scheduled':
      counts.visit_scheduled += 1;
      return;
    case 'proposal_sent':
      counts.proposal_sent += 1;
      return;
    case 'enrolled':
      counts.enrolled += 1;
      return;
    case 'lost':
      counts.lost += 1;
      return;
    case 'total':
      return;
  }
}

export interface GradeLeadMetrics {
  grade: string;
  leadCount: number;
  enrollmentCount: number;
}

export interface ShiftLeadMetrics {
  shift: string;
  leadCount: number;
  enrollmentCount: number;
}

export interface ProgramEnrollmentMetrics {
  total: number;
  active: number;
  totalVacancies: number;
  filledVacancies: number;
}

export interface EventTypeCounts {
  total: number;
  upcoming: number;
  schoolToursCount: number;
  openHouseCount: number;
  enrollmentFairCount: number;
}

function requireAnalyticsProfileId(profileId: string): void {
  if (!isValidUuid(profileId)) {
    throw new Error('Education analytics requires a valid profile ID');
  }
}

function analyticsQueryError(operation: string, error: { message: string }): never {
  logger.error(`[EducationQueries] ${operation}:`, error);
  throw new Error(error.message);
}

/**
 * Conta leads por status para analytics
 */
export async function countLeadsByStatus(
  profileId: string,
): Promise<LeadStatusCounts> {
  requireAnalyticsProfileId(profileId);

  const { data, error } = await supabase
    .from('education_leads')
    .select('status')
    .eq('education_profile_id', profileId);

  if (error) {
    analyticsQueryError('Error counting leads by status', error);
  }

  const counts: LeadStatusCounts = {
    total: 0,
    new: 0,
    contacted: 0,
    visit_scheduled: 0,
    proposal_sent: 0,
    enrolled: 0,
    lost: 0,
  };

  (data ?? []).forEach((lead) => {
    const status = lead.status as keyof LeadStatusCounts;
    if (status in counts) {
      incrementLeadStatusCount(counts, status);
    }
    counts.total += 1;
  });

  return counts;
}

/**
 * Calcula metricas de leads por serie (desired_grade)
 */
export async function getLeadsByGradeMetrics(
  profileId: string,
): Promise<GradeLeadMetrics[]> {
  requireAnalyticsProfileId(profileId);

  const { data, error } = await supabase
    .from('education_leads')
    .select('desired_grade, status')
    .eq('education_profile_id', profileId)
    .not('desired_grade', 'is', null);

  if (error) {
    analyticsQueryError('Error fetching leads by grade', error);
  }

  const gradeMap = new Map<
    string,
    { leadCount: number; enrollmentCount: number }
  >();

  (data ?? []).forEach((lead) => {
    const grade = lead.desired_grade ?? 'Nao informada';
    const current = gradeMap.get(grade) ?? {
      leadCount: 0,
      enrollmentCount: 0,
    };
    current.leadCount += 1;
    if (lead.status === 'enrolled') {
      current.enrollmentCount += 1;
    }
    gradeMap.set(grade, current);
  });

  return Array.from(gradeMap.entries())
    .map(([grade, metrics]) => ({
      grade,
      leadCount: metrics.leadCount,
      enrollmentCount: metrics.enrollmentCount,
    }))
    .sort((a, b) => b.leadCount - a.leadCount);
}

/**
 * Calcula metricas de leads por turno (desired_shift)
 */
export async function getLeadsByShiftMetrics(
  profileId: string,
): Promise<ShiftLeadMetrics[]> {
  requireAnalyticsProfileId(profileId);

  const { data, error } = await supabase
    .from('education_leads')
    .select('desired_shift, status')
    .eq('education_profile_id', profileId)
    .not('desired_shift', 'is', null);

  if (error) {
    analyticsQueryError('Error fetching leads by shift', error);
  }

  const shiftMap = new Map<
    string,
    { leadCount: number; enrollmentCount: number }
  >();

  (data ?? []).forEach((lead) => {
    const shift = lead.desired_shift ?? 'Nao informado';
    const current = shiftMap.get(shift) ?? {
      leadCount: 0,
      enrollmentCount: 0,
    };
    current.leadCount += 1;
    if (lead.status === 'enrolled') {
      current.enrollmentCount += 1;
    }
    shiftMap.set(shift, current);
  });

  const shiftLabels: Record<string, string> = {
    morning: 'Manha',
    afternoon: 'Tarde',
    evening: 'Noite',
    full_day: 'Integral',
    'Nao informado': 'Nao informado',
  };

  return Array.from(shiftMap.entries())
    .map(([shift, metrics]) => ({
      shift: getRecordValue(shiftLabels, shift) ?? shift,
      leadCount: metrics.leadCount,
      enrollmentCount: metrics.enrollmentCount,
    }))
    .sort((a, b) => b.leadCount - a.leadCount);
}

/**
 * Calcula metricas de matricula nos programas (using max_capacity e current_enrollment)
 */
export async function getProgramEnrollmentMetrics(
  profileId: string,
): Promise<ProgramEnrollmentMetrics> {
  requireAnalyticsProfileId(profileId);

  const { data, error } = await supabase
    .from('education_programs')
    .select('is_active, max_capacity, current_enrollment')
    .eq('education_profile_id', profileId);

  if (error) {
    analyticsQueryError('Error fetching program enrollment metrics', error);
  }

  let total = 0;
  let active = 0;
  let totalVacancies = 0;
  let filledVacancies = 0;

  (data ?? []).forEach((program) => {
    total += 1;
    if (program.is_active) active += 1;
    if (program.max_capacity !== null) {
      totalVacancies += program.max_capacity;
    }
    if (program.current_enrollment !== null) {
      filledVacancies += program.current_enrollment;
    }
  });

  return { total, active, totalVacancies, filledVacancies };
}

/**
 * Conta eventos por tipo (school_event_type)
 */
export async function countEventsByType(
  profileId: string,
): Promise<EventTypeCounts> {
  requireAnalyticsProfileId(profileId);

  const { data, error } = await supabase
    .from('education_events')
    .select('school_event_type, starts_at')
    .eq('education_profile_id', profileId);

  if (error) {
    analyticsQueryError('Error counting events by type', error);
  }

  const now = new Date().toISOString();
  let total = 0;
  let upcoming = 0;
  let schoolToursCount = 0;
  let openHouseCount = 0;
  let enrollmentFairCount = 0;

  (data ?? []).forEach((event) => {
    total += 1;
    if (event.starts_at > now) upcoming += 1;
    if (event.school_event_type === 'school_tour') {
      schoolToursCount += 1;
    } else if (event.school_event_type === 'open_house') {
      openHouseCount += 1;
    } else if (event.school_event_type === 'enrollment_fair') {
      enrollmentFairCount += 1;
    }
  });

  return {
    total,
    upcoming,
    schoolToursCount,
    openHouseCount,
    enrollmentFairCount,
  };
}

/**
 * Calcula taxa de conversao de leads
 */
export async function getLeadPipelineMetrics(
  profileId: string,
): Promise<{ conversionRate: number; avgDaysToFirstContact: number }> {
  requireAnalyticsProfileId(profileId);

  const { data, error } = await supabase
    .from('education_leads')
    .select('status, first_contact_at, created_at')
    .eq('education_profile_id', profileId);

  if (error) {
    analyticsQueryError('Error calculating lead pipeline metrics', error);
  }

  const leads = data ?? [];
  const enrolled = leads.filter((lead) => lead.status === 'enrolled').length;
  const conversionRate =
    leads.length > 0 ? Math.round((enrolled / leads.length) * 100) : 0;

  const firstContactDays = leads.flatMap((lead) => {
    if (!lead.first_contact_at || !lead.created_at) return [];

    const createdAt = new Date(lead.created_at).getTime();
    const firstContactAt = new Date(lead.first_contact_at).getTime();
    const elapsedMs = firstContactAt - createdAt;
    if (!Number.isFinite(elapsedMs) || elapsedMs < 0) return [];

    return [elapsedMs / (1000 * 60 * 60 * 24)];
  });

  const avgDaysToFirstContact =
    firstContactDays.length > 0
      ? Math.round(
          firstContactDays.reduce((sum, days) => sum + days, 0) /
            firstContactDays.length,
        )
      : 0;

  return { conversionRate, avgDaysToFirstContact };
}

// ============================================================
// TERRITORIAL QUERIES
// ============================================================

export interface TerritorialProfileParams {
  state: string;
  city: string;
  district: string;
  slug: string;
}

/**
 * Busca perfil de educacao por rota territorial
 * Resolve location -> public_business_search -> education_profiles
 */
export async function getEducationProfileByTerritory(
  params: TerritorialProfileParams,
): Promise<EducationPublicProfile | null> {
  const { state, city, district, slug } = params;

  // Resolve location_id pelo caminho geografico canonico
  const geographicPath = `/br/${state}/${city}/${district}`;

  const { data: locationData, error: locationError } = await supabase
    .from('locations')
    .select('id')
    .eq('geographic_path', geographicPath)
    .maybeSingle();

  if (locationError) {
    logger.error('[EducationQueries] Error fetching location by territory:', locationError);
    return null;
  }

  if (!locationData) {
    logger.warn('[EducationQueries] Location not found for path:', geographicPath);
    return null;
  }

  // Busca business ativo no territorio com o slug informado
  const { data: business, error: businessError } = await supabase
    .from('public_business_search')
    .select('profile_id, business_name, slug')
    .eq('slug', slug)
    .eq('location_id', locationData.id)
    .eq('status', 'active')
    .in('business_role', ['standalone', 'branch'])
    .maybeSingle();

  if (businessError) {
    logger.error('[EducationQueries] Error fetching business by territory:', businessError);
    return null;
  }

  if (!business?.profile_id) {
    return null;
  }

  // Busca o education_profile associado
  const { data, error } = await supabase
    .from('education_profiles')
    .select('*')
    .eq('business_id', business.profile_id)
    .eq('status', 'published')
    .maybeSingle();

  if (error) {
    logger.error('[EducationQueries] Error fetching education profile:', error);
    return null;
  }

  if (!data) return null;

  return {
    ...(data as EducationProfile),
    business_name: business.business_name ?? null,
    public_route: parseEducationPublicRoute(geographicPath, business.slug),
  };
}

// ============================================================
// ANALYTICS QUERIES - Real Tracking Data
// ============================================================
