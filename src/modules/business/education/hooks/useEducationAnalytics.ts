/**
 * useEducationAnalytics Hook
 *
 * Hook para acessar métricas e analytics do módulo Education.
 * Integra com EducationSubscriptionService para validar entitlements.
 *
 * @version 1.0.0
 */

import { useQuery } from '@tanstack/react-query';
import { useEducationSubscription } from './useEducationSubscription';
import * as educationQueries from '@/core/education/services/education.queries';
import { logger } from '@/shared/utils/logger';
import type { EducationAnalyticsData } from '@/core/education';

// ============================================================
// TIPOS
// ============================================================

export interface UseEducationAnalyticsOptions {
  businessId: string;
  profileId?: string;
  enabled?: boolean;
  nicheKey?: string | null; // Para gerar métricas específicas do nicho
  enrollmentOpen?: boolean | null;
}

// ============================================================
// HOOK
// ============================================================

export function useEducationAnalytics(options: UseEducationAnalyticsOptions) {
  const {
    businessId,
    profileId,
    enabled = true,
    nicheKey,
    enrollmentOpen = null,
  } = options;
  // Todos os consumidores usam a mesma query canônica de assinatura.
  // Um erro de leitura nunca deve ser tratado como plano gratuito ou upgrade.
  const subscription = useEducationSubscription({
    businessId,
    enabled: enabled && Boolean(businessId),
  });
  const canAccessAnalytics = Boolean(
    subscription.status?.isActive && subscription.entitlements?.canUseAnalytics,
  );
  const canExport = Boolean(
    subscription.status?.isActive && subscription.entitlements?.canExportData,
  );

  const analyticsQuery = useQuery({
    queryKey: [
      'education',
      'analytics',
      businessId,
      profileId,
      nicheKey,
      enrollmentOpen,
    ],
    queryFn: async (): Promise<EducationAnalyticsData> => {
      if (!profileId) {
        throw new Error('Perfil Education obrigatório para consultar analytics');
      }

      try {
        const [
          leadStatusCounts,
          leadPipelineMetrics,
          programMetrics,
          eventCounts,
        ] = await Promise.all([
          educationQueries.countLeadsByStatus(profileId),
          educationQueries.getLeadPipelineMetrics(profileId),
          educationQueries.getProgramEnrollmentMetrics(profileId),
          educationQueries.countEventsByType(profileId),
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
            conversionRate: leadPipelineMetrics.conversionRate,
            avgDaysToFirstContact:
              leadPipelineMetrics.avgDaysToFirstContact,
          },
          programs: {
            total: programMetrics.total,
            active: programMetrics.active,
            avgEnrollmentRate:
              programMetrics.totalVacancies > 0
                ? Math.round(
                    (programMetrics.filledVacancies /
                      programMetrics.totalVacancies) *
                      100,
                  )
                : 0,
            totalVacancies: programMetrics.totalVacancies,
            filledVacancies: programMetrics.filledVacancies,
          },
          events: {
            total: eventCounts.total,
            upcoming: eventCounts.upcoming,
            schoolToursCount: eventCounts.schoolToursCount,
            openHouseCount: eventCounts.openHouseCount,
            enrollmentFairCount: eventCounts.enrollmentFairCount,
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

          return {
            ...baseData,
            leads: {
              ...baseData.leads,
              byGrade,
              byShift,
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
              enrollmentWindowOpen: enrollmentOpen,
              mostRequestedGrade,
              mostRequestedShift,
            },
          };
        }

        return baseData;
      } catch (error) {
        logger.error('[useEducationAnalytics] Error fetching analytics:', error);
        throw error;
      }
    },
    enabled: enabled && Boolean(businessId) && Boolean(profileId) &&
      canAccessAnalytics && !subscription.isError,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  return {
    // Analytics data
    data: analyticsQuery.data,
    isLoading: analyticsQuery.isLoading,
    isRefreshing: analyticsQuery.isFetching && !analyticsQuery.isLoading,
    isError: analyticsQuery.isError,
    error: analyticsQuery.error,
    refetch: analyticsQuery.refetch,

    // Entitlements
    entitlements: subscription.entitlements,
    planType: subscription.status?.planType,
    isActive: subscription.status?.isActive,
    isEntitlementLoading: subscription.isLoading,
    isEntitlementError: subscription.isError,
    entitlementError: subscription.error,
    refetchEntitlement: subscription.refetch,

    // Permission checks
    canAccessAnalytics,
    canExport,

    // Raw queries para uso avançado
    queries: educationQueries,
  };
}

export default useEducationAnalytics;
