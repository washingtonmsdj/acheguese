/**
 * useBusinessSubscription - leitura operacional da assinatura de empresa.
 *
 * A tabela financeira user_subscriptions permanece owner-only. Este hook resolve
 * plano/entitlements pelo EntitlementResolver, que usa o broker server-side para
 * escopo Business e portanto pode ser consumido por Proprietario ou Gestor.
 */
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/core/auth/hooks/useAuth';
import { EntitlementResolver } from '../services/EntitlementResolver';
import { EntitlementsService } from '../entitlements';
import { PlanTier } from '../types';

function toPlanTier(value: string | null | undefined): PlanTier {
  const normalized = value?.replace(/^base-/, '');
  if (normalized === PlanTier.DELIVERY) return PlanTier.DELIVERY;
  if (normalized === PlanTier.PRO) return PlanTier.PRO;
  return PlanTier.FREE;
}

export function useBusinessSubscription(
  businessDataId: string | undefined,
) {
  const { user } = useAuth();
  const {
    data: result,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['business-subscription-operational', businessDataId, user?.id],
    queryFn: async () => {
      if (!businessDataId) {
        throw new Error('business_data.id e obrigatorio');
      }
      if (!user?.id) {
        throw new Error('Usuario autenticado e obrigatorio');
      }

      const resolved = await EntitlementResolver.resolve({
        user_id: user.id,
        business_id: businessDataId,
        subscription_scope: 'business',
      });
      const planTier = toPlanTier(resolved.planTier);

      return {
        planTier,
        entitlements: resolved,
        isActive: resolved.isActive,
      };
    },
    enabled: Boolean(businessDataId && user?.id),
    staleTime: 1000 * 60 * 5,
  });

  const planTier = result?.planTier ?? PlanTier.FREE;
  const entitlements =
    result?.entitlements ?? EntitlementsService.getAll(PlanTier.FREE);
  const isActive = result?.isActive ?? false;

  return {
    // Detalhes financeiros nao sao projetados por este hook operacional.
    subscription: null,
    planTier,
    entitlements,

    isLoading,
    error: error instanceof Error ? error.message : null,

    isActive,
    isCanceled: false,
    isPastDue: false,
    isTrialing: false,
    willCancelAtPeriodEnd: false,
    isFree: planTier === PlanTier.FREE,
    isPro: planTier === PlanTier.PRO,
    isDelivery: planTier === PlanTier.DELIVERY,

    refetch,
  };
}
