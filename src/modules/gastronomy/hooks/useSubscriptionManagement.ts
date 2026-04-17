/**
 * useSubscriptionManagement — Hook para gerenciar assinaturas
 *
 * Centraliza toda a lógica de gerenciamento de assinaturas do vertical Gastronomia.
 * Consome GastronomyStripeService e mantém sincronização com o banco de dados.
 *
 * Uso:
 * ```typescript
 * const { subscription, upgrade, cancel, reactivate } = useSubscriptionManagement(businessId);
 * ```
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { PlanTier } from '@/core/billing';
import {
  GastronomySubscriptionService,
} from '@/modules/gastronomy/services/gastronomy-subscription.service';

// ══════════════════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════════════════

export interface UpgradeParams {
  newPlanTier: PlanTier.PRO | PlanTier.DELIVERY;
  prorationBehavior?: 'create_prorations' | 'none' | 'always_invoice';
}

// ══════════════════════════════════════════════════════════════════════════
// HOOK
// ══════════════════════════════════════════════════════════════════════════

export function useSubscriptionManagement(businessId: string) {
  const queryClient = useQueryClient();
  
  // ────────────────────────────────────────────────────────────────────────
  // QUERIES
  // ────────────────────────────────────────────────────────────────────────
  
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
   * Busca histórico de faturas
   */
  const {
    data: invoices,
    isLoading: isLoadingInvoices,
  } = useQuery({
    queryKey: ['gastronomy-invoices', businessId],
    queryFn: async () => {
      // TODO: Implementar busca de faturas via edge function
      // que chama GastronomyStripeService.listInvoices()
      return [];
    },
    enabled: !!businessId && subscription?.stripe_subscription_id != null,
  });
  
  // ────────────────────────────────────────────────────────────────────────
  // MUTATIONS
  // ────────────────────────────────────────────────────────────────────────
  
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
        toast.success('Assinatura será cancelada no fim do período atual.');
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
   * Mutation para adicionar método de pagamento
   */
  const addPaymentMethodMutation = useMutation({
    mutationFn: async (paymentMethodId: string) => {
      return GastronomySubscriptionService.addPaymentMethod({
        businessId,
        paymentMethodId,
      });
    },
    onSuccess: () => {
      toast.success('Método de pagamento adicionado com sucesso!');
      
      // Invalidar queries
      queryClient.invalidateQueries({ queryKey: ['gastronomy-subscription', businessId] });
    },
    onError: (error: Error) => {
      toast.error(`Erro ao adicionar método de pagamento: ${error.message}`);
    },
  });
  
  // ────────────────────────────────────────────────────────────────────────
  // COMPUTED
  // ────────────────────────────────────────────────────────────────────────
  
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
  
  // ────────────────────────────────────────────────────────────────────────
  // RETURN
  // ────────────────────────────────────────────────────────────────────────
  
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
