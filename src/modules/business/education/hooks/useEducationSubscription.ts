/**
 * useEducationSubscription Hook
 *
 * Hook para gerenciar assinatura e entitlements do módulo Education.
 * Wrapper reativo ao redor do EducationSubscriptionService.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  const planTier = status?.planTier;



  return {
    status,
    isLoading: statusQuery.isLoading,
    isError: statusQuery.isError,
    error: statusQuery.error,
    refetch: statusQuery.refetch,
    entitlements,
    planTier,
    isActive: status?.isActive,
    expiresAt: status?.expiresAt,
    refresh: refreshMutation.mutate,
    isRefreshing: refreshMutation.isPending,
  };
}

export default useEducationSubscription;
