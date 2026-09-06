/**
 * useBusinessSubscription - Hook de assinatura de empresa.
 *
 * O hook orquestra cache/UI e delega leitura/gateway ao owner explicito
 * BusinessSubscriptionService.
 */

import { useQuery } from '@tanstack/react-query';
import { BusinessSubscriptionService } from '../BusinessSubscriptionService';
import { EntitlementsService } from '../entitlements';
import { BillingPlanService } from '../services/BillingPlanService';
import { PlanTier } from '../types';

export function useBusinessSubscription(businessDataId: string | undefined) {
  const {
    data: result,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['business-subscription', businessDataId],
    queryFn: async () => {
      if (!businessDataId) throw new Error('business_data.id e obrigatorio');

      const subscriptionResult = await BusinessSubscriptionService.getByBusinessId(businessDataId);
      if (subscriptionResult.error) {
        throw new Error(subscriptionResult.error);
      }

      const subscription = subscriptionResult.data;
      const planTier = subscription?.plan_tier || PlanTier.FREE;

      let entitlements = EntitlementsService.getAll(planTier);

      try {
        const dynamicEntitlements = await BillingPlanService.getEntitlements(planTier);
        if (dynamicEntitlements) {
          entitlements = dynamicEntitlements;
        }
      } catch {
        // Baseline local e apenas fallback de disponibilidade; o catalogo e a fonte dinamica.
      }

      return {
        subscription: subscription || null,
        planTier,
        entitlements,
      };
    },
    enabled: !!businessDataId,
    staleTime: 1000 * 60 * 5,
  });

  const subscription = result?.subscription || null;
  const planTier = result?.planTier || PlanTier.FREE;
  const entitlements = result?.entitlements || EntitlementsService.getAll(PlanTier.FREE);

  const isActive = subscription?.status === 'active';
  const isCanceled = subscription?.status === 'canceled';
  const isPastDue = subscription?.status === 'past_due';
  const isTrialing = subscription?.status === 'trialing';
  const willCancelAtPeriodEnd = subscription?.cancel_at_period_end || false;

  const isFree = planTier === PlanTier.FREE;
  const isPro = planTier === PlanTier.PRO;
  const isDelivery = planTier === PlanTier.DELIVERY;

  return {
    subscription,
    planTier,
    entitlements,

    isLoading,
    error: error instanceof Error ? error.message : null,

    isActive,
    isCanceled,
    isPastDue,
    isTrialing,
    willCancelAtPeriodEnd,
    isFree,
    isPro,
    isDelivery,

    refetch,
  };
}
