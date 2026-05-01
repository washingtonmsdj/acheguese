/**
 * Education Queries - SSOT Read Model
 *
 * Todas as operacoes de leitura para o modulo Education.
 * Sem side effects, sem mutations.
 *
 * @version 1.0.0
 */

import { supabase } from '@/integrations/supabase';
import { logger } from '@/shared/utils/logger';
import type {
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
  profiles: EducationProfile[];
  nextPage: number | null;
  totalCount: number;
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
    logger.error('[EducationQueries] Error fetching profile by id:', error);
    return null;
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
    logger.error('[EducationQueries] Error fetching profile by business_id:', error);
    return null;
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
  } = {},
): Promise<PaginatedEducationProfiles> {
  const { page = 1, pageSize = 20, nicheKey } = options;

  let query = supabase
    .from('education_profiles')
    .select('*', { count: 'exact' })
    .eq('status', 'published');

  if (nicheKey) {
    query = query.eq('niche_key', nicheKey);
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
    profiles: (data ?? []) as EducationProfile[],
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
    logger.error('[EducationQueries] Error listing programs:', error);
    return [];
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
    logger.error('[EducationQueries] Error fetching program by id:', error);
    return null;
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
    query = query.eq('status', status);
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (error) {
    logger.error('[EducationQueries] Error listing leads:', error);
    return { leads: [], totalCount: 0 };
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
    logger.error('[EducationQueries] Error fetching lead by id:', error);
    return null;
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
    logger.error('[EducationQueries] Error listing lead events:', error);
    return [];
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
    logger.error('[EducationQueries] Error listing events:', error);
    return [];
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
    logger.error('[EducationQueries] Error fetching event by id:', error);
    return null;
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

/**
 * Conta leads por status para analytics
 */
export async function countLeadsByStatus(profileId: string): Promise<LeadStatusCounts> {
  if (!isValidUuid(profileId)) {
    return { total: 0, new: 0, contacted: 0, visit_scheduled: 0, proposal_sent: 0, enrolled: 0, lost: 0 };
  }
  const { data, error } = await supabase
    .from('education_leads')
    .select('status')
    .eq('education_profile_id', profileId);

  if (error) {
    logger.error('[EducationQueries] Error counting leads by status:', error);
    return { total: 0, new: 0, contacted: 0, visit_scheduled: 0, proposal_sent: 0, enrolled: 0, lost: 0 };
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
      counts[status]++;
    }
    counts.total++;
  });

  return counts;
}

/**
 * Calcula métricas de leads por série (desired_grade)
 */
export async function getLeadsByGradeMetrics(profileId: string): Promise<GradeLeadMetrics[]> {
  if (!isValidUuid(profileId)) return [];
  const { data, error } = await supabase
    .from('education_leads')
    .select('desired_grade, status')
    .eq('education_profile_id', profileId)
    .not('desired_grade', 'is', null);

  if (error) {
    logger.error('[EducationQueries] Error fetching leads by grade:', error);
    return [];
  }

  const gradeMap = new Map<string, { leadCount: number; enrollmentCount: number }>();

  (data ?? []).forEach((lead) => {
    const grade = lead.desired_grade ?? 'Não informada';
    const current = gradeMap.get(grade) ?? { leadCount: 0, enrollmentCount: 0 };
    current.leadCount++;
    if (lead.status === 'enrolled') {
      current.enrollmentCount++;
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
 * Calcula métricas de leads por turno (desired_shift)
 */
export async function getLeadsByShiftMetrics(profileId: string): Promise<ShiftLeadMetrics[]> {
  if (!isValidUuid(profileId)) return [];
  const { data, error } = await supabase
    .from('education_leads')
    .select('desired_shift, status')
    .eq('education_profile_id', profileId)
    .not('desired_shift', 'is', null);

  if (error) {
    logger.error('[EducationQueries] Error fetching leads by shift:', error);
    return [];
  }

  const shiftMap = new Map<string, { leadCount: number; enrollmentCount: number }>();

  (data ?? []).forEach((lead) => {
    const shift = lead.desired_shift ?? 'Não informado';
    const current = shiftMap.get(shift) ?? { leadCount: 0, enrollmentCount: 0 };
    current.leadCount++;
    if (lead.status === 'enrolled') {
      current.enrollmentCount++;
    }
    shiftMap.set(shift, current);
  });

  const shiftLabels: Record<string, string> = {
    morning: 'Manhã',
    afternoon: 'Tarde',
    evening: 'Noite',
    full_day: 'Integral',
    'Não informado': 'Não informado',
  };

  return Array.from(shiftMap.entries())
    .map(([shift, metrics]) => ({
      shift: shiftLabels[shift] ?? shift,
      leadCount: metrics.leadCount,
      enrollmentCount: metrics.enrollmentCount,
    }))
    .sort((a, b) => b.leadCount - a.leadCount);
}

/**
 * Calcula métricas de matrícula nos programas (using max_capacity e current_enrollment)
 */
export async function getProgramEnrollmentMetrics(profileId: string): Promise<ProgramEnrollmentMetrics> {
  if (!isValidUuid(profileId)) {
    return { total: 0, active: 0, totalVacancies: 0, filledVacancies: 0 };
  }
  const { data, error } = await supabase
    .from('education_programs')
    .select('is_active, max_capacity, current_enrollment')
    .eq('education_profile_id', profileId);

  if (error) {
    logger.error('[EducationQueries] Error fetching program enrollment metrics:', error);
    return { total: 0, active: 0, totalVacancies: 0, filledVacancies: 0 };
  }

  let total = 0;
  let active = 0;
  let totalVacancies = 0;
  let filledVacancies = 0;

  (data ?? []).forEach((program) => {
    total++;
    if (program.is_active) {
      active++;
    }
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
export async function countEventsByType(profileId: string): Promise<EventTypeCounts> {
  if (!isValidUuid(profileId)) {
    return { total: 0, upcoming: 0, schoolToursCount: 0, openHouseCount: 0, enrollmentFairCount: 0 };
  }
  const { data, error } = await supabase
    .from('education_events')
    .select('school_event_type, starts_at')
    .eq('education_profile_id', profileId);

  if (error) {
    logger.error('[EducationQueries] Error counting events by type:', error);
    return { total: 0, upcoming: 0, schoolToursCount: 0, openHouseCount: 0, enrollmentFairCount: 0 };
  }

  const now = new Date().toISOString();
  let total = 0;
  let upcoming = 0;
  let schoolToursCount = 0;
  let openHouseCount = 0;
  let enrollmentFairCount = 0;

  (data ?? []).forEach((event) => {
    total++;
    if (event.starts_at > now) {
      upcoming++;
    }
    if (event.school_event_type === 'school_tour') {
      schoolToursCount++;
    } else if (event.school_event_type === 'open_house') {
      openHouseCount++;
    } else if (event.school_event_type === 'enrollment_fair') {
      enrollmentFairCount++;
    }
  });

  return { total, upcoming, schoolToursCount, openHouseCount, enrollmentFairCount };
}

/**
 * Calcula taxa de conversão de leads
 */
export async function getLeadConversionRate(profileId: string): Promise<{ rate: number; avgDays: number }> {
  if (!isValidUuid(profileId)) return { rate: 0, avgDays: 0 };
  const { data, error } = await supabase
    .from('education_leads')
    .select('status, first_contact_at, created_at')
    .eq('education_profile_id', profileId);

  if (error) {
    logger.error('[EducationQueries] Error calculating conversion rate:', error);
    return { rate: 0, avgDays: 0 };
  }

  const total = (data ?? []).length;
  const enrolled = (data ?? []).filter((l) => l.status === 'enrolled').length;
  const rate = total > 0 ? Math.round((enrolled / total) * 100) : 0;

  // Calculate average days to conversion (contacted -> enrolled)
  let totalDays = 0;
  let convertedCount = 0;

  (data ?? []).forEach((lead) => {
    if (lead.status === 'enrolled' && lead.first_contact_at && lead.created_at) {
      const createdAt = new Date(lead.created_at);
      const contactedAt = new Date(lead.first_contact_at);
      const days = Math.round((contactedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
      if (days >= 0) {
        totalDays += days;
        convertedCount++;
      }
    }
  });

  const avgDays = convertedCount > 0 ? Math.round(totalDays / convertedCount) : 0;

  return { rate, avgDays };
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
 * Resolve location -> business_data -> education_profiles
 */
export async function getEducationProfileByTerritory(
  params: TerritorialProfileParams,
): Promise<EducationProfile | null> {
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
    .from('business_data')
    .select('id')
    .eq('slug', slug)
    .eq('location_id', locationData.id)
    .eq('status', 'active')
    .in('business_role', ['standalone', 'branch'])
    .maybeSingle();

  if (businessError) {
    logger.error('[EducationQueries] Error fetching business by territory:', businessError);
    return null;
  }

  if (!business?.id) {
    return null;
  }

  // Busca o education_profile associado
  const { data, error } = await supabase
    .from('education_profiles')
    .select('*')
    .eq('business_id', business.id)
    .eq('status', 'published')
    .maybeSingle();

  if (error) {
    logger.error('[EducationQueries] Error fetching education profile:', error);
    return null;
  }

  return data as EducationProfile | null;
}

// ============================================================
// ANALYTICS QUERIES - Real Tracking Data
// ============================================================

export interface ProfileViewMetrics {
  totalViews: number;
  uniqueSessions: number;
  viewsLast7Days: number;
  viewsLast30Days: number;
}

export interface ConversionFunnelMetrics {
  profileViews: number;
  whatsappClicks: number;
  ctaClicks: number;
  leadsSubmitted: number;
  leadsContacted: number;
  leadsVisited: number;
  leadsEnrolled: number;
  leadsLost: number;
}

export interface ProgramViewMetrics {
  programId: string;
  programName: string;
  viewCount: number;
  leadCount: number;
  conversionRate: number;
}

export interface EventMetrics {
  eventId: string;
  eventTitle: string;
  viewCount: number;
  interestCount: number;
}

/**
 * Conta visualizacoes de perfil
 */
export async function getProfileViewMetrics(profileId: string): Promise<ProfileViewMetrics> {
  if (!isValidUuid(profileId)) {
    return { totalViews: 0, uniqueSessions: 0, viewsLast7Days: 0, viewsLast30Days: 0 };
  }
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('education_analytics_events')
    .select('session_id, created_at')
    .eq('education_profile_id', profileId)
    .eq('event_type', 'profile_view');

  if (error) {
    logger.error('[EducationQueries] Error fetching profile views:', error);
    return { totalViews: 0, uniqueSessions: 0, viewsLast7Days: 0, viewsLast30Days: 0 };
  }

  const events = data ?? [];
  const sessions = new Set(events.map((e) => e.session_id));

  return {
    totalViews: events.length,
    uniqueSessions: sessions.size,
    viewsLast7Days: events.filter((e) => e.created_at >= sevenDaysAgo).length,
    viewsLast30Days: events.filter((e) => e.created_at >= thirtyDaysAgo).length,
  };
}

/**
 * Calcula funil de conversao
 */
export async function getConversionFunnel(profileId: string): Promise<ConversionFunnelMetrics> {
  if (!isValidUuid(profileId)) {
    return {
      profileViews: 0, whatsappClicks: 0, ctaClicks: 0, leadsSubmitted: 0,
      leadsContacted: 0, leadsVisited: 0, leadsEnrolled: 0, leadsLost: 0,
    };
  }
  const { data, error } = await supabase
    .from('education_analytics_events')
    .select('event_type, lead_id')
    .eq('education_profile_id', profileId)
    .in('event_type', [
      'profile_view', 'whatsapp_click', 'enrollment_cta_click',
      'lead_submitted'
    ]);

  if (error) {
    logger.error('[EducationQueries] Error fetching funnel:', error);
    return {
      profileViews: 0, whatsappClicks: 0, ctaClicks: 0, leadsSubmitted: 0,
      leadsContacted: 0, leadsVisited: 0, leadsEnrolled: 0, leadsLost: 0,
    };
  }

  const events = data ?? [];
  const submittedLeadIds = events
    .filter((e) => e.event_type === 'lead_submitted' && e.lead_id)
    .map((e) => e.lead_id);

  // Busca status dos leads enviados
  const { data: leadData } = await supabase
    .from('education_leads')
    .select('status')
    .in('id', submittedLeadIds)
    .eq('education_profile_id', profileId);

  const leads = leadData ?? [];

  return {
    profileViews: events.filter((e) => e.event_type === 'profile_view').length,
    whatsappClicks: events.filter((e) => e.event_type === 'whatsapp_click').length,
    ctaClicks: events.filter((e) => e.event_type === 'enrollment_cta_click').length,
    leadsSubmitted: submittedLeadIds.length,
    leadsContacted: leads.filter((l) => ['contacted', 'visit_scheduled', 'proposal_sent', 'enrolled'].includes(l.status)).length,
    leadsVisited: leads.filter((l) => ['visit_scheduled', 'proposal_sent', 'enrolled'].includes(l.status)).length,
    leadsEnrolled: leads.filter((l) => l.status === 'enrolled').length,
    leadsLost: leads.filter((l) => l.status === 'lost').length,
  };
}

/**
 * Calcula views e conversao por programa
 */
export async function getProgramViewMetrics(profileId: string): Promise<ProgramViewMetrics[]> {
  if (!isValidUuid(profileId)) return [];
  const { data: programs, error: progError } = await supabase
    .from('education_programs')
    .select('id, name')
    .eq('education_profile_id', profileId);

  if (progError || !programs) {
    logger.error('[EducationQueries] Error fetching programs:', progError);
    return [];
  }

  const { data: views, error: viewError } = await supabase
    .from('education_analytics_events')
    .select('program_id')
    .eq('education_profile_id', profileId)
    .eq('event_type', 'program_view')
    .not('program_id', 'is', null);

  const { data: leads, error: leadError } = await supabase
    .from('education_leads')
    .select('desired_grade, status')
    .eq('education_profile_id', profileId)
    .not('desired_grade', 'is', null);

  if (viewError || leadError) {
    logger.error('[EducationQueries] Error fetching program metrics:', viewError || leadError);
    return [];
  }

  return programs.map((program) => {
    const viewCount = (views ?? []).filter((v) => v.program_id === program.id).length;
    // Mapeia desired_grade com program.name (aproximacao)
    const leadCount = (leads ?? []).filter((l) =>
      l.desired_grade?.toLowerCase().includes(program.name.toLowerCase())
    ).length;

    return {
      programId: program.id,
      programName: program.name,
      viewCount,
      leadCount,
      conversionRate: viewCount > 0 ? Math.round((leadCount / viewCount) * 100) : 0,
    };
  });
}

/**
 * Calcula views e interesse por evento
 */
export async function getEventMetrics(profileId: string): Promise<EventMetrics[]> {
  if (!isValidUuid(profileId)) return [];
  const { data: events, error: eventError } = await supabase
    .from('education_events')
    .select('id, title')
    .eq('education_profile_id', profileId);

  if (eventError || !events) {
    logger.error('[EducationQueries] Error fetching events:', eventError);
    return [];
  }

  const { data: analytics, error: analError } = await supabase
    .from('education_analytics_events')
    .select('education_event_id, event_type')
    .eq('education_profile_id', profileId)
    .in('event_type', ['event_view', 'event_interest'])
    .not('education_event_id', 'is', null);

  if (analError) {
    logger.error('[EducationQueries] Error fetching event analytics:', analError);
    return [];
  }

  return events.map((event) => ({
    eventId: event.id,
    eventTitle: event.title,
    viewCount: (analytics ?? []).filter(
      (a) => a.education_event_id === event.id && a.event_type === 'event_view'
    ).length,
    interestCount: (analytics ?? []).filter(
      (a) => a.education_event_id === event.id && a.event_type === 'event_interest'
    ).length,
  }));
}
