/**
 * useEducationAnalytics Hook
 *
 * Hook para acessar métricas e analytics do módulo Education.
 * Integra com EducationSubscriptionService para validar entitlements.
 *
 * @version 1.0.0
 */

import { useQuery } from '@tanstack/react-query';
import { EducationSubscriptionService } from '../services/education-subscription.service';
import * as educationQueries from '../services/education.queries';
import { logger } from '@/shared/utils/logger';

// ============================================================
// TIPOS
// ============================================================

// Métricas por série (para escolas regulares)
export interface GradeMetrics {
  grade: string; // Ex: "1º ano", "6º ano"
  leadCount: number;
  enrollmentCount: number;
  vacancyRate: number; // % de vagas preenchidas
}

// Métricas por turno (para escolas regulares)
export interface ShiftMetrics {
  shift: string; // Ex: "morning", "afternoon"
  leadCount: number;
  enrollmentCount: number;
  interestLevel: 'high' | 'medium' | 'low';
}

export interface EducationAnalyticsData {
  leads: {
    total: number;
    new: number;
    contacted: number;
    visitScheduled: number;
    proposalSent: number;
    enrolled: number;
    lost: number;
    conversionRate: number;
    avgDaysToConversion: number;
    // Campos específicos para escola regular
    byGrade?: GradeMetrics[]; // Leads por série
    byShift?: ShiftMetrics[]; // Leads por turno
    guardianVsStudentRatio?: number; // % leads onde responsável ≠ aluno
  };
  programs: {
    total: number;
    active: number;
    avgViews: number;
    avgInquiries: number;
    // Campos específicos para escola regular
    avgEnrollmentRate?: number; // Taxa média de ocupação das turmas
    totalVacancies?: number; // Total de vagas disponíveis
    filledVacancies?: number; // Vagas já preenchidas
  };
  events: {
    total: number;
    upcoming: number;
    totalAttendees: number;
    // Campos específicos para escola regular
    schoolToursCount?: number; // Visitas escolares agendadas
    openHouseCount?: number; // Eventos de portas abertas
    enrollmentFairCount?: number; // Feiras de matrícula
  };
  period: {
    start: string;
    end: string;
  };
  // Métricas exclusivas para escola regular
  schoolMetrics?: {
    enrollmentWindowOpen: boolean;
    totalGradesOffered: number;
    totalShiftsOffered: number;
    mostRequestedGrade: string | null;
    mostRequestedShift: string | null;
  };
}

export interface UseEducationAnalyticsOptions {
  businessId: string;
  profileId?: string;
  period?: '7d' | '30d' | '90d' | '1y';
  enabled?: boolean;
  nicheKey?: string | null; // Para gerar métricas específicas do nicho
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function calculateInterestLevel(count: number): 'high' | 'medium' | 'low' {
  if (count >= 50) return 'high';
  if (count >= 20) return 'medium';
  return 'low';
}

function calculateVacancyRate(total: number, filled: number): number {
  if (total === 0) return 0;
  return Math.round((filled / total) * 100);
}

// ============================================================
// HOOK
// ============================================================

export function useEducationAnalytics(options: UseEducationAnalyticsOptions) {
  const { businessId, period = '30d', enabled = true, nicheKey } = options;

  const analyticsQuery = useQuery({
    queryKey: ['education', 'analytics', businessId, profileId, period, nicheKey],
    queryFn: async (): Promise<EducationAnalyticsData | null> => {
      // Verifica entitlement
      const canAccess = await EducationSubscriptionService.canUseAnalytics(businessId);

      if (!canAccess) {
        logger.warn('[useEducationAnalytics] Analytics not available for business:', businessId);
        return null;
      }

      if (!profileId) {
        logger.warn('[useEducationAnalytics] No profileId provided');
        return null;
      }

      try {
        // Fetch real analytics data including tracking metrics
        const [
          leadStatusCounts,
          { rate: conversionRate, avgDays: avgDaysToConversion },
          programMetrics,
          eventCounts,
          profileViewMetrics,
          funnelMetrics,
          programViewMetrics,
          eventViewMetrics,
        ] = await Promise.all([
          educationQueries.countLeadsByStatus(profileId),
          educationQueries.getLeadConversionRate(profileId),
          educationQueries.getProgramEnrollmentMetrics(profileId),
          educationQueries.countEventsByType(profileId),
          educationQueries.getProfileViewMetrics(profileId),
          educationQueries.getConversionFunnel(profileId),
          educationQueries.getProgramViewMetrics(profileId),
          educationQueries.getEventMetrics(profileId),
        ]);

        const baseData: EducationAnalyticsData = {
          leads: {
            total: leadStatusCounts.total,
            new: leadStatusCounts.new,
            contacted: leadStatusCounts.contacted,
            visitScheduled: leadStatusCounts.visit_scheduled,
            proposalSent: leadStatusCounts.proposal_sent,
            enrolled: leadStatusCounts.enrolled,
            lost: leadStatusCounts.lost,
            conversionRate,
            avgDaysToConversion,
          },
          programs: {
            total: programMetrics.total,
            active: programMetrics.active,
            avgViews: Math.round(profileViewMetrics.totalViews / (programMetrics.total || 1)),
            avgInquiries: funnelMetrics.leadsSubmitted > 0
              ? Math.round(profileViewMetrics.totalViews / funnelMetrics.leadsSubmitted)
              : 0,
            avgEnrollmentRate: programMetrics.totalVacancies > 0
              ? Math.round((programMetrics.filledVacancies / programMetrics.totalVacancies) * 100)
              : 0,
            totalVacancies: programMetrics.totalVacancies,
            filledVacancies: programMetrics.filledVacancies,
          },
          events: {
            total: eventCounts.total,
            upcoming: eventCounts.upcoming,
            totalAttendees: funnelMetrics.leadsVisited,
            schoolToursCount: eventCounts.schoolToursCount,
            openHouseCount: eventCounts.openHouseCount,
            enrollmentFairCount: eventCounts.enrollmentFairCount,
          },
          period: {
            start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            end: new Date().toISOString(),
          },
        };

        // Se for escola regular, adiciona métricas escolares específicas
        if (nicheKey === 'regular_school') {
          const [byGrade, byShift] = await Promise.all([
            educationQueries.getLeadsByGradeMetrics(profileId),
            educationQueries.getLeadsByShiftMetrics(profileId),
          ]);

          // Calcular métricas escolares adicionais
          const avgEnrollmentRate =
            programMetrics.totalVacancies > 0
              ? Math.round((programMetrics.filledVacancies / programMetrics.totalVacancies) * 100)
              : 0;

          const mostRequestedGrade =
            byGrade.length > 0 ? byGrade[0].grade : null;
          const mostRequestedShift =
            byShift.length > 0 ? byShift[0].shift : null;

          // Fetch profile para enrollment_open
          const profile = await educationQueries.getEducationProfileById(profileId);

          return {
            ...baseData,
            leads: {
              ...baseData.leads,
              byGrade: byGrade.map((g) => ({
                ...g,
                vacancyRate: calculateVacancyRate(
                  byGrade.reduce((sum, x) => sum + x.enrollmentCount, 0) || 1,
                  g.enrollmentCount,
                ),
              })),
              byShift: byShift.map((s) => ({
                ...s,
                interestLevel: calculateInterestLevel(s.leadCount),
              })),
              guardianVsStudentRatio: leadStatusCounts.total > 0
                ? Math.round((leadStatusCounts.contacted / leadStatusCounts.total) * 100)
                : 0, // Ratio aproximado: leads contactados vs total (indica envolvimento do responsável)
            },
            programs: {
              ...baseData.programs,
              avgEnrollmentRate,
              totalVacancies: programMetrics.totalVacancies,
              filledVacancies: programMetrics.filledVacancies,
            },
            events: {
              ...baseData.events,
              schoolToursCount: eventCounts.schoolToursCount,
              openHouseCount: eventCounts.openHouseCount,
              enrollmentFairCount: eventCounts.enrollmentFairCount,
            },
            schoolMetrics: {
              enrollmentWindowOpen: profile?.enrollment_open ?? false,
              totalGradesOffered: byGrade.length,
              totalShiftsOffered: byShift.length,
              mostRequestedGrade,
              mostRequestedShift,
            },
          };
        }

        return baseData;
      } catch (error) {
        logger.error('[useEducationAnalytics] Error fetching analytics:', error);
        return null;
      }
    },
    enabled: enabled && Boolean(businessId) && Boolean(profileId),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  const entitlementQuery = useQuery({
    queryKey: ['education', 'entitlements', businessId],
    queryFn: () => EducationSubscriptionService.getSubscriptionStatus(businessId),
    enabled: enabled && Boolean(businessId),
    staleTime: 10 * 60 * 1000, // 10 minutos
  });

  return {
    // Analytics data
    data: analyticsQuery.data,
    isLoading: analyticsQuery.isLoading || analyticsQuery.isFetching,
    isError: analyticsQuery.isError,
    error: analyticsQuery.error,
    refetch: analyticsQuery.refetch,

    // Entitlements
    entitlements: entitlementQuery.data?.entitlements,
    planType: entitlementQuery.data?.planType,
    isActive: entitlementQuery.data?.isActive,

    // Permission checks
    canAccessAnalytics: entitlementQuery.data?.entitlements.canUseAnalytics ?? false,
    canExport: entitlementQuery.data?.entitlements.canExportData ?? false,

    // Raw queries para uso avançado
    queries: educationQueries,
  };
}

export default useEducationAnalytics;
