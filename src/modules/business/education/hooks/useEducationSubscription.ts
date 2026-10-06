/**
 * useEducationSubscription Hook
 *
 * Hook para gerenciar assinatura e entitlements do módulo Education.
 * Wrapper reativo ao redor do EducationSubscriptionService.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PlanTier } from '@/core/billing/types';
import { EducationSubscriptionService } from '../services/education-subscription.service';
import type { EducationSubscriptionStatus } from '../services/education-subscription.service';

export interface UseEducationSubscriptionOptions {
  businessId: string;
  enabled?: boolean;
}

export function useEducationSubscription(options: UseEducationSubscriptionOptions) {
  const { businessId, enabled = true } = options;
  const queryClient = useQueryClient();

  const statusQuery = useQuery({
    queryKey: ['education', 'subscription', businessId],
    queryFn: async (): Promise<EducationSubscriptionStatus> => {
      return EducationSubscriptionService.getSubscriptionStatus(businessId);
    },
    enabled: enabled && Boolean(businessId),
    staleTime: 5 * 60 * 1000,
  });

  const refreshMutation = useMutation({
    mutationFn: async () => {
      return EducationSubscriptionService.getSubscriptionStatus(businessId);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['education', 'subscription', businessId], data);
    },
  });

  const status = statusQuery.data;
  const entitlements = status?.entitlements;
  const planTier = status?.planTier ?? PlanTier.FREE;

  const permissions = {
    canUsePremiumPublicPage: entitlements?.canUsePremiumPublicPage ?? false,
    canUseShortPremiumLink: entitlements?.canUseShortPremiumLink ?? false,
    canUseShortLink: entitlements?.canUseShortPremiumLink ?? false,
    canUsePremiumSite: entitlements?.canUsePremiumPublicPage ?? false,
    canUseAnalytics: entitlements?.canUseAnalytics ?? false,
    canExportData: entitlements?.canExportData ?? false,
    isPremium: planTier === PlanTier.DELIVERY,
    isBasic: planTier === PlanTier.PRO,
    isFree: planTier === PlanTier.FREE,
  };

  return {
    status,
    isLoading: statusQuery.isLoading,
    isError: statusQuery.isError,
    error: statusQuery.error,
    refetch: statusQuery.refetch,
    entitlements,
    planTier,
    /** @deprecated Compatibilidade de apresentação. Prefira planTier para regras. */
    planType: status?.planType ?? 'free',
    isActive: status?.isActive ?? false,
    expiresAt: status?.expiresAt,
    permissions,
    refresh: refreshMutation.mutate,
    isRefreshing: refreshMutation.isPending,
  };
}

export default useEducationSubscription;
