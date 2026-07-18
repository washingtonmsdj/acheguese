/**
 * useBusinessSubscription - Hook para gerenciar assinatura de empresa
 *
 * SSOT: Hook central que todos os modulos devem usar.
 */

import { useQuery } from "@tanstack/react-query";
import { SubscriptionService } from "../SubscriptionService";
import { EntitlementsService } from "../entitlements";
import { BillingPlanService } from "../services/BillingPlanService";
import { PlanTier } from "../types";
import { withTimeout } from "@/shared/utils/withTimeout";

export function useBusinessSubscription(businessId: string | undefined) {
  const {
    data: result,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["business-subscription", businessId],
    queryFn: async () => {
      if (!businessId) throw new Error("businessId e obrigatorio");

      const subscriptionResult = await withTimeout(
        SubscriptionService.getByBusinessId(businessId),
        {
          message: "A consulta da assinatura excedeu o tempo limite.",
          timeoutMs: 10_000,
        },
      );
      if (subscriptionResult.error) {
        throw new Error(subscriptionResult.error);
      }

      const subscription = subscriptionResult.data;
      const planTier = subscription?.plan_tier || PlanTier.FREE;

      let entitlements = EntitlementsService.getAll(planTier);

      try {
        const dynamicEntitlements = await withTimeout(
          BillingPlanService.getEntitlements(planTier),
          {
            message:
              "A consulta de permissoes do plano excedeu o tempo limite.",
            timeoutMs: 5_000,
          },
        );
        if (dynamicEntitlements) {
          entitlements = dynamicEntitlements;
        }
      } catch {
        // fallback para legado
      }

      return {
        subscription: subscription || null,
        planTier,
        entitlements,
      };
    },
    enabled: !!businessId,
    retry: 1,
    retryDelay: 750,
    staleTime: 1000 * 60 * 5,
  });

  const subscription = result?.subscription || null;
  const planTier = result?.planTier || PlanTier.FREE;
  const entitlements =
    result?.entitlements || EntitlementsService.getAll(PlanTier.FREE);

  const isActive = subscription?.status === "active";
  const isCanceled = subscription?.status === "canceled";
  const isPastDue = subscription?.status === "past_due";
  const isTrialing = subscription?.status === "trialing";
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
