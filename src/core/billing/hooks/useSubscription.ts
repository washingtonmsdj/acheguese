/**
 * ══════════════════════════════════════════════════════════════════════════
 * USE SUBSCRIPTION HOOK
 * ══════════════════════════════════════════════════════════════════════════
 * 
 * Hook React para gerenciar assinaturas do usuário.
 * 
 * ══════════════════════════════════════════════════════════════════════════
 */

import { useQuery } from '@tanstack/react-query';
import { SubscriptionService } from '../services/SubscriptionService';
import { useAuth } from '@/core/auth/hooks/useAuth';

export function useSubscription() {
  const { user } = useAuth();

  // Query: Assinatura atual
  const {
    data: subscription,
    isLoading: isLoadingSubscription,
    error: subscriptionError,
    refetch: refetchSubscription,
  } = useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: () => SubscriptionService.getCurrentUserSubscription(),
    enabled: !!user,
  });

  // Query: Assinatura ativa (com dados do plano)
  const {
    data: activeSubscription,
    isLoading: isLoadingActive,
    error: activeError,
    refetch: refetchActive,
  } = useQuery({
    queryKey: ['subscription', 'active', user?.id],
    queryFn: () => SubscriptionService.getActiveSubscription(),
    enabled: !!user,
  });

  // Computed values
  const isActive = subscription?.status === 'active' || subscription?.status === 'trialing';
  const isTrialing = subscription?.status === 'trialing';
  const isCanceled = subscription?.cancel_at_period_end === true;
  const isPastDue = subscription?.status === 'past_due';
  const planCode = subscription?.plan_code || 'free';
  const planName = activeSubscription?.plan_name || 'Free';

  // Helpers
  const hasPlano = async (code: string) => {
    return SubscriptionService.hasPlano(code);
  };

  const hasFeature = async (feature: string) => {
    return SubscriptionService.hasFeature(feature);
  };

  const getEntitlementLimit = async (entitlement: string) => {
    return SubscriptionService.getEntitlementLimit(entitlement);
  };

  const canUpgrade = planCode === 'free' || planCode === 'pro';
  const canDowngrade = planCode === 'pro' || planCode === 'delivery';

  // Status helpers
  const isPro = planCode === 'pro';
  const isDelivery = planCode === 'delivery';
  const isFree = planCode === 'free';

  return {
    // Data
    subscription,
    activeSubscription,
    isLoadingSubscription,
    isLoadingActive,
    subscriptionError,
    activeError,

    // Status
    isActive,
    isTrialing,
    isCanceled,
    isPastDue,
    planCode,
    planName,

    // Plan checks
    isPro,
    isDelivery,
    isFree,

    // Capabilities
    canUpgrade,
    canDowngrade,

    // Methods
    hasPlano,
    hasFeature,
    getEntitlementLimit,
    refetchSubscription,
    refetchActive,
  };
}
