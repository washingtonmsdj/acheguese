/**
 * ══════════════════════════════════════════════════════════════════════════
 * USE BILLING HOOK
 * ══════════════════════════════════════════════════════════════════════════
 * 
 * Hook React para operações de billing (checkout, portal, planos).
 * 
 * ══════════════════════════════════════════════════════════════════════════
 */

import { useQuery, useMutation } from '@tanstack/react-query';
import { BillingService, CreateCheckoutParams } from '../services/BillingService';
import { useToast } from '@/shared/hooks/use-toast';

export function useBilling() {
  const { toast } = useToast();

  // Query: Obter todos os planos
  const {
    data: plans,
    isLoading: isLoadingPlans,
    error: plansError,
    refetch: refetchPlans,
  } = useQuery({
    queryKey: ['billing', 'plans'],
    queryFn: () => BillingService.getPlans(),
  });

  // Mutation: Criar checkout session
  const createCheckout = useMutation({
    mutationFn: (params: CreateCheckoutParams) =>
      BillingService.createCheckoutSession(params),
    onSuccess: () => {
      toast({
        title: 'Redirecionando para checkout',
        description: 'Você será redirecionado para o Stripe em instantes...',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao criar checkout',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Mutation: Criar portal session
  const createPortal = useMutation({
    mutationFn: (returnUrl: string) => BillingService.createPortalSession(returnUrl),
    onSuccess: () => {
      toast({
        title: 'Redirecionando para portal',
        description: 'Você será redirecionado para gerenciar sua assinatura...',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao abrir portal',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Helper: Redirecionar para checkout
  const redirectToCheckout = async (params: CreateCheckoutParams) => {
    try {
      await BillingService.redirectToCheckout(params);
    } catch (error) {
      toast({
        title: 'Erro ao redirecionar',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    }
  };

  // Helper: Redirecionar para portal
  const redirectToPortal = async (returnUrl: string) => {
    try {
      await BillingService.redirectToPortal(returnUrl);
    } catch (error) {
      toast({
        title: 'Erro ao redirecionar',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    }
  };

  // Helper: Obter plano por código
  const getPlanByCode = (code: string) => {
    return plans?.find((plan) => plan.code === code);
  };

  return {
    // Data
    plans,
    isLoadingPlans,
    plansError,

    // Mutations
    createCheckout,
    createPortal,

    // Helpers
    redirectToCheckout,
    redirectToPortal,
    getPlanByCode,
    refetchPlans,
  };
}
