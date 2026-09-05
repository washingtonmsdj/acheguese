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
import type { EducationSubscriptionStatus } from '../services/education-subscription.service';

// ============================================================
// TIPOS
// ============================================================

export interface UseEducationSubscriptionOptions {
  businessId: string;
  enabled?: boolean;
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
    isPremium: status?.planType === 'premium',
    isBasic: status?.planType === 'basic',
    isFree: status?.planType === 'free',
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
    refresh: refreshMutation.mutate,
    isRefreshing: refreshMutation.isPending,
  };
}

export default useEducationSubscription;
