/**
 * useEducationSubscription Hook
 *
 * Hook para gerenciar assinatura e entitlements do módulo Education.
 * Wrapper reativo ao redor do EducationSubscriptionService.
 *
 * @version 1.0.0
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { EducationSubscriptionService } from '../services/education-subscription.service';
import type { EducationEntitlements, EducationSubscriptionStatus } from '../services/education-subscription.service';

// ============================================================
// TIPOS
// ============================================================

export interface UseEducationSubscriptionOptions {
  businessId: string;
  enabled?: boolean;
}

export interface SubscriptionLimits {
  programs: {
    current: number;
    max: number;
    canCreate: boolean;
  };
  leads: {
    current: number;
    max: number;
    canReceive: boolean;
  };
  events: {
    current: number;
    max: number;
    canCreate: boolean;
  };
  storage: {
    used: number;
    max: number;
    percentage: number;
  };
}

// ============================================================
// HOOK
// ============================================================

export function useEducationSubscription(options: UseEducationSubscriptionOptions) {
  const { businessId, enabled = true } = options;
  const queryClient = useQueryClient();

  // Query principal de status
  const statusQuery = useQuery({
    queryKey: ['education', 'subscription', businessId],
    queryFn: async (): Promise<EducationSubscriptionStatus> => {
      return EducationSubscriptionService.getSubscriptionStatus(businessId);
    },
    enabled: enabled && Boolean(businessId),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Mutation para atualizar dados (quando necessário)
  const refreshMutation = useMutation({
    mutationFn: async () => {
      return EducationSubscriptionService.getSubscriptionStatus(businessId);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['education', 'subscription', businessId], data);
    },
  });

  // Helpers de permissão memoizados
  const status = statusQuery.data;
  const entitlements = status?.entitlements;

  const permissions = {
    // Premium features
    canUsePremiumPublicPage: entitlements?.canUsePremiumPublicPage ?? false,
    canUseShortPremiumLink: entitlements?.canUseShortPremiumLink ?? false,
    canUseShortLink: entitlements?.canUseShortPremiumLink ?? false,
    canUsePremiumSite: entitlements?.canUsePremiumPublicPage ?? false,
    
    // Data features
    canUseAnalytics: entitlements?.canUseAnalytics ?? false,
    canExportData: entitlements?.canExportData ?? false,
    
    // Baseado no status ativo
    isPremium: status?.planType === 'premium' || status?.planType === 'enterprise',
    isBasic: status?.planType === 'basic',
    isFree: status?.planType === 'free',
  };

  // Calcula limites atuais (se os dados de uso forem fornecidos)
  const calculateLimits = (
    currentUsage: {
      programCount: number;
      leadsThisMonth: number;
      eventCount: number;
      storageUsedMB?: number;
    }
  ): SubscriptionLimits => {
    const entitlements = status?.entitlements;
    
    if (!entitlements) {
      return {
        programs: { current: 0, max: 0, canCreate: false },
        leads: { current: 0, max: 0, canReceive: false },
        events: { current: 0, max: 0, canCreate: false },
        storage: { used: 0, max: 0, percentage: 0 },
      };
    }

    return {
      programs: {
        current: currentUsage.programCount,
        max: entitlements.maxPrograms,
        canCreate: currentUsage.programCount < entitlements.maxPrograms,
      },
      leads: {
        current: currentUsage.leadsThisMonth,
        max: entitlements.maxLeadsPerMonth,
        canReceive: currentUsage.leadsThisMonth < entitlements.maxLeadsPerMonth,
      },
      events: {
        current: currentUsage.eventCount,
        max: entitlements.maxEvents,
        canCreate: currentUsage.eventCount < entitlements.maxEvents,
      },
      storage: {
        used: currentUsage.storageUsedMB ?? 0,
        max: entitlements.storageMB,
        percentage: Math.min(
          100,
          Math.round(((currentUsage.storageUsedMB ?? 0) / entitlements.storageMB) * 100)
        ),
      },
    };
  };

  return {
    // Status
    status,
    isLoading: statusQuery.isLoading,
    isError: statusQuery.isError,
    error: statusQuery.error,
    
    // Entitlements
    entitlements,
    planType: status?.planType ?? 'free',
    isActive: status?.isActive ?? false,
    expiresAt: status?.expiresAt,
    
    // Permissões calculadas
    permissions,
    
    // Helpers
    calculateLimits,
    refresh: refreshMutation.mutate,
    isRefreshing: refreshMutation.isPending,
  };
}

export default useEducationSubscription;
