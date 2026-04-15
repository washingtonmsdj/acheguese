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
import { supabase } from '@/integrations/supabase';
import { PlanTier } from '@/core/billing';

// ══════════════════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════════════════

export interface GastronomySubscription {
  id: string;
  business_id: string;
  plan_tier: PlanTier;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  trial_end: string | null;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionWithDetails extends GastronomySubscription {
  business_name?: string;
  stripe_customer_id?: string;
}

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
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gastronomy_subscriptions')
        .select(`
          *,
          business_data!inner(name)
        `)
        .eq('business_id', businessId)
        .single();
      
      if (error) throw error;
      
      return {
        ...data,
        business_name: data.business_data?.name,
      } as SubscriptionWithDetails;
    },
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
      // Chamar edge function que usa GastronomyStripeService
      const { data, error } = await supabase.functions.invoke('gastronomy-upgrade-plan', {
        body: {
          businessId,
          newPlanTier: params.newPlanTier,
          prorationBehavior: params.prorationBehavior,
        },
      });
      
      if (error) throw error;
      return data;
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
      // Chamar edge function que usa GastronomyStripeService
      const { data, error } = await supabase.functions.invoke('gastronomy-cancel-subscription', {
        body: {
          businessId,
          immediately,
        },
      });
      
      if (error) throw error;
      return data;
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
      // Chamar edge function que usa GastronomyStripeService
      const { data, error } = await supabase.functions.invoke('gastronomy-reactivate-subscription', {
        body: { businessId },
      });
      
      if (error) throw error;
      return data;
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
      // Chamar edge function que usa GastronomyStripeService
      const { data, error } = await supabase.functions.invoke('gastronomy-add-payment-method', {
        body: {
          businessId,
          paymentMethodId,
        },
      });
      
      if (error) throw error;
      return data;
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
