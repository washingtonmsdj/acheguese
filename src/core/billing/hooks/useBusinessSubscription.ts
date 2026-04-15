/**
 * useBusinessSubscription — Hook para gerenciar assinatura de empresa
 *
 * SSOT: Hook central que todos os módulos devem usar.
 * 
 * Uso:
 * ```typescript
 * const { subscription, planTier, entitlements, isLoading } = useBusinessSubscription(businessId);
 * 
 * if (entitlements.canUsePromotions) {
 *   // Mostrar recurso de promoções
 * }
 * ```
 */

import { useQuery } from '@tanstack/react-query';
import { SubscriptionService } from '../SubscriptionService';
import { EntitlementsService } from '../entitlements';
import { PlanTier } from '../types';

// ══════════════════════════════════════════════════════════════════════════
// HOOK
// ══════════════════════════════════════════════════════════════════════════

export function useBusinessSubscription(businessId: string | undefined) {
  // Buscar assinatura
  const {
    data: result,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['business-subscription', businessId],
    queryFn: async () => {
      if (!businessId) throw new Error('businessId é obrigatório');
      return SubscriptionService.getByBusinessId(businessId);
    },
    enabled: !!businessId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
  
  const subscription = result?.data;
  const planTier = subscription?.plan_tier || PlanTier.FREE;
  const entitlements = EntitlementsService.getAll(planTier);
  
  // Status flags
  const isActive = subscription?.status === 'active';
  const isCanceled = subscription?.status === 'canceled';
  const isPastDue = subscription?.status === 'past_due';
  const isTrialing = subscription?.status === 'trialing';
  const willCancelAtPeriodEnd = subscription?.cancel_at_period_end || false;
  
  return {
    // Data
    subscription,
    planTier,
    entitlements,
    
    // Loading
    isLoading,
    error: result?.error || (error instanceof Error ? error.message : null),
    
    // Status flags
    isActive,
    isCanceled,
    isPastDue,
    isTrialing,
    willCancelAtPeriodEnd,
    
    // Actions
    refetch,
  };
}

