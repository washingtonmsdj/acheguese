/**
 * BILLING PLANS CRUD HOOKS — ADMIN ONLY
 * 
 * Hooks React Query para gerenciar CRUD de planos de billing.
 * Apenas para uso em páginas admin.
 * 
 * SSOT: Consome BillingPlanService
 */
import { logger } from '@/shared/utils/logger';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BillingPlanService, type BillingPlan } from '../services/BillingPlanService';
import { toast } from 'sonner';

// ══════════════════════════════════════════════════════════════════════════
// QUERY KEYS
// ══════════════════════════════════════════════════════════════════════════

export const billingPlanAdminKeys = {
  all: ['billing-plans-admin'] as const,
  allPlans: () => [...billingPlanAdminKeys.all, 'all'] as const,
  plan: (id: string) => [...billingPlanAdminKeys.all, 'plan', id] as const,
};

// ══════════════════════════════════════════════════════════════════════════
// QUERY HOOKS
// ══════════════════════════════════════════════════════════════════════════

/**
 * Hook para buscar TODOS os planos (incluindo inativos)
 * ADMIN ONLY
 */
export function useAllBillingPlans() {
  return useQuery({
    queryKey: billingPlanAdminKeys.allPlans(),
    queryFn: () => BillingPlanService.getAllPlans(),
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 5 * 60 * 1000, // 5 minutos
  });
}

// ══════════════════════════════════════════════════════════════════════════
// MUTATION HOOKS
// ══════════════════════════════════════════════════════════════════════════

/**
 * Hook para criar novo plano
 * ADMIN ONLY
 */
export function useCreateBillingPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (plan: Omit<BillingPlan, 'id' | 'createdAt' | 'updatedAt'>) =>
      BillingPlanService.createPlan(plan),
    onSuccess: (newPlan) => {
      queryClient.invalidateQueries({ queryKey: billingPlanAdminKeys.all });
      toast.success(`Plano "${newPlan.name}" criado com sucesso!`);
      logger.info('Plano criado:', { planId: newPlan.id, code: newPlan.code });
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar plano: ${error.message}`);
      logger.error('Erro ao criar plano:', error);
    },
  });
}

/**
 * Hook para atualizar plano existente
 * ADMIN ONLY
 */
export function useUpdateBillingPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Omit<BillingPlan, 'id' | 'createdAt' | 'updatedAt'>>;
    }) => BillingPlanService.updatePlan(id, updates),
    onSuccess: (updatedPlan) => {
      queryClient.invalidateQueries({ queryKey: billingPlanAdminKeys.all });
      toast.success(`Plano "${updatedPlan.name}" atualizado com sucesso!`);
      logger.info('Plano atualizado:', { planId: updatedPlan.id, code: updatedPlan.code });
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar plano: ${error.message}`);
      logger.error('Erro ao atualizar plano:', error);
    },
  });
}

/**
 * Hook para deletar plano
 * ADMIN ONLY - USE COM CUIDADO
 */
export function useDeleteBillingPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => BillingPlanService.deletePlan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billingPlanAdminKeys.all });
      toast.success('Plano deletado com sucesso!');
      logger.info('Plano deletado');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao deletar plano: ${error.message}`);
      logger.error('Erro ao deletar plano:', error);
    },
  });
}

/**
 * Hook para ativar/desativar plano
 * ADMIN ONLY
 */
export function useToggleBillingPlanActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      BillingPlanService.toggleActive(id, isActive),
    onSuccess: (updatedPlan) => {
      queryClient.invalidateQueries({ queryKey: billingPlanAdminKeys.all });
      const status = updatedPlan.isActive ? 'ativado' : 'desativado';
      toast.success(`Plano "${updatedPlan.name}" ${status}!`);
      logger.info('Plano toggle active:', {
        planId: updatedPlan.id,
        isActive: updatedPlan.isActive,
      });
    },
    onError: (error: Error) => {
      toast.error(`Erro ao alterar status: ${error.message}`);
      logger.error('Erro ao toggle active:', error);
    },
  });
}

/**
 * Hook para marcar/desmarcar como featured
 * ADMIN ONLY
 */
export function useToggleBillingPlanFeatured() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isFeatured }: { id: string; isFeatured: boolean }) =>
      BillingPlanService.toggleFeatured(id, isFeatured),
    onSuccess: (updatedPlan) => {
      queryClient.invalidateQueries({ queryKey: billingPlanAdminKeys.all });
      const status = updatedPlan.isFeatured ? 'marcado como destaque' : 'removido do destaque';
      toast.success(`Plano "${updatedPlan.name}" ${status}!`);
      logger.info('Plano toggle featured:', {
        planId: updatedPlan.id,
        isFeatured: updatedPlan.isFeatured,
      });
    },
    onError: (error: Error) => {
      toast.error(`Erro ao alterar destaque: ${error.message}`);
      logger.error('Erro ao toggle featured:', error);
    },
  });
}

/**
 * Hook para reordenar planos
 * ADMIN ONLY
 */
export function useReorderBillingPlans() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (planIds: string[]) => BillingPlanService.reorderPlans(planIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billingPlanAdminKeys.all });
      toast.success('Ordem dos planos atualizada!');
      logger.info('Planos reordenados');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao reordenar planos: ${error.message}`);
      logger.error('Erro ao reordenar planos:', error);
    },
  });
}
