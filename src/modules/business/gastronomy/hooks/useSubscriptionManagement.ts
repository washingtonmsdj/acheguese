/**
 * useSubscriptionManagement - Hook para gerenciar assinaturas de gastronomia.
 *
 * Usa GastronomySubscriptionService, que delega billing para o core/billing.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { PlanTier } from '@/core/billing';
import {
  GastronomySubscriptionService,
} from '@/modules/business/gastronomy/services/gastronomy-subscription.service';

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// TYPES
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

export interface UpgradeParams {
  newPlanTier: PlanTier.PRO | PlanTier.DELIVERY;
  prorationBehavior?: 'create_prorations' | 'none' | 'always_invoice';
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// HOOK
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

export function useSubscriptionManagement(businessId: string) {
  const queryClient = useQueryClient();

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // QUERIES
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  /**
   * Busca assinatura atual
   */
  const {
    data: subscription,
    isLoading,
    error: fetchError,
  } = useQuery({
    queryKey: ['gastronomy-subscription', businessId],
    queryFn: () => GastronomySubscriptionService.getSubscriptionWithDetails(businessId),
    enabled: !!businessId,
  });

  /**
   * Busca histÃ³rico de faturas
   */
  const {
    data: invoices,
    isLoading: isLoadingInvoices,
  } = useQuery({
    queryKey: ['gastronomy-invoices', businessId],
    queryFn: async () => GastronomySubscriptionService.listInvoices(businessId),
    enabled: !!businessId && subscription?.stripe_subscription_id != null,
  });

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // MUTATIONS
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  /**
   * Mutation para fazer upgrade/downgrade
   */
  const upgradeMutation = useMutation({
    mutationFn: async (params: UpgradeParams) => {
      return GastronomySubscriptionService.upgradePlan({
        businessId,
        newPlanTier: params.newPlanTier,
        prorationBehavior: params.prorationBehavior,
      });
    },
    onSuccess: (data, variables) => {
      const planName = variables.newPlanTier === PlanTier.PRO ? 'Pro' : 'Delivery';
      toast.success(`Plano atualizado para ${planName} com sucesso!`);

      // Invalidar queries
      queryClient.invalidateQueries({ queryKey: ['gastronomy-subscription', businessId] });
      queryClient.invalidateQueries({ queryKey: ['gastronomy-profile', businessId] });
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar plano: ${error.message}`);
    },
  });

  /**
   * Mutation para cancelar assinatura
   */
  const cancelMutation = useMutation({
    mutationFn: async (immediately: boolean = false) => {
      return GastronomySubscriptionService.cancelSubscription({
        businessId,
        immediately,
      });
    },
    onSuccess: (data, immediately) => {
      if (immediately) {
        toast.success('Assinatura cancelada imediatamente.');
      } else {
        toast.success('Assinatura serÃ¡ cancelada no fim do perÃ­odo atual.');
      }

      // Invalidar queries
      queryClient.invalidateQueries({ queryKey: ['gastronomy-subscription', businessId] });
    },
    onError: (error: Error) => {
      toast.error(`Erro ao cancelar assinatura: ${error.message}`);
    },
  });

  /**
   * Mutation para reativar assinatura
   */
  const reactivateMutation = useMutation({
    mutationFn: async () => {
      return GastronomySubscriptionService.reactivateSubscription(businessId);
    },
    onSuccess: () => {
      toast.success('Assinatura reativada com sucesso!');

      // Invalidar queries
      queryClient.invalidateQueries({ queryKey: ['gastronomy-subscription', businessId] });
    },
    onError: (error: Error) => {
      toast.error(`Erro ao reativar assinatura: ${error.message}`);
    },
  });

  /**
   * Mutation para adicionar mÃ©todo de pagamento
   */
  const addPaymentMethodMutation = useMutation({
    mutationFn: async (paymentMethodId: string) => {
      return GastronomySubscriptionService.addPaymentMethod({
        businessId,
        paymentMethodId,
      });
    },
    onSuccess: () => {
      toast.success('MÃ©todo de pagamento adicionado com sucesso!');

      // Invalidar queries
      queryClient.invalidateQueries({ queryKey: ['gastronomy-subscription', businessId] });
    },
    onError: (error: Error) => {
      toast.error(`Erro ao adicionar mÃ©todo de pagamento: ${error.message}`);
    },
  });

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // COMPUTED
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const currentPlan = subscription?.plan_tier || PlanTier.FREE;
  const isActive = subscription?.status === 'active';
  const isCanceled = subscription?.status === 'canceled';
  const isPastDue = subscription?.status === 'past_due';
  const isTrialing = subscription?.status === 'trialing';
  const willCancelAtPeriodEnd = subscription?.cancel_at_period_end || false;

  const canUpgrade = isActive && currentPlan !== PlanTier.DELIVERY;
  const canDowngrade = isActive && currentPlan !== PlanTier.FREE;
  const canCancel = isActive && !willCancelAtPeriodEnd;
  const canReactivate = isActive && willCancelAtPeriodEnd;

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // RETURN
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  return {
    // Data
    subscription,
    invoices,
    currentPlan,

    // Loading states
    isLoading,
    isLoadingInvoices,
    isUpgrading: upgradeMutation.isPending,
    isCanceling: cancelMutation.isPending,
    isReactivating: reactivateMutation.isPending,
    isAddingPaymentMethod: addPaymentMethodMutation.isPending,

    // Status flags
    isActive,
    isCanceled,
    isPastDue,
    isTrialing,
    willCancelAtPeriodEnd,

    // Capability flags
    canUpgrade,
    canDowngrade,
    canCancel,
    canReactivate,

    // Actions
    upgrade: upgradeMutation.mutateAsync,
    cancel: cancelMutation.mutateAsync,
    reactivate: reactivateMutation.mutateAsync,
    addPaymentMethod: addPaymentMethodMutation.mutateAsync,

    // Errors
    fetchError,
  };
}
