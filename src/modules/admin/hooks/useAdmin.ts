/**
 * useAdmin — Hook para gerenciar administração
 *
 * Consome AdminService (SSOT).
 * NÃO acessa Supabase diretamente.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminService } from '@/core/admin/AdminService';
import { toast } from 'sonner';

// ── Query Keys ────────────────────────────────────────────────────────────

export const adminKeys = {
  all: ['admin'] as const,
  businesses: (filters?: any) => [...adminKeys.all, 'businesses', filters] as const,
  profiles: (filters?: any) => [...adminKeys.all, 'profiles', filters] as const,
  planUsage: () => [...adminKeys.all, 'plan-usage'] as const,
  platformStats: () => [...adminKeys.all, 'platform-stats'] as const,
};

// ── Hooks ─────────────────────────────────────────────────────────────────

/**
 * Hook para listar empresas
 */
export function useBusinesses(filters?: {
  plan_tier?: string;
  is_active?: boolean;
  search?: string;
  limit?: number;
}) {
  return useQuery({
    queryKey: adminKeys.businesses(filters),
    queryFn: async () => {
      const result = await AdminService.listBusinesses(filters);
      if (result.error) throw new Error(result.error);
      return result.data || [];
    },
    refetchInterval: 60000, // Refetch a cada 1 minuto
  });
}

/**
 * Hook para listar perfis
 */
export function useProfiles(filters?: {
  search?: string;
  limit?: number;
}) {
  return useQuery({
    queryKey: adminKeys.profiles(filters),
    queryFn: async () => {
      const result = await AdminService.listProfiles(filters);
      if (result.error) throw new Error(result.error);
      return result.data || [];
    },
    refetchInterval: 60000,
  });
}

/**
 * Hook para listar uso de planos
 */
export function usePlanUsage() {
  return useQuery({
    queryKey: adminKeys.planUsage(),
    queryFn: async () => {
      const result = await AdminService.listPlanUsage();
      if (result.error) throw new Error(result.error);
      return result.data || [];
    },
    refetchInterval: 300000, // Refetch a cada 5 minutos
  });
}

/**
 * Hook para estatísticas da plataforma
 */
export function usePlatformStats() {
  return useQuery({
    queryKey: adminKeys.platformStats(),
    queryFn: async () => {
      const result = await AdminService.getPlatformStats();
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    refetchInterval: 60000,
  });
}

// ── Mutations ─────────────────────────────────────────────────────────────

/**
 * Hook para ativar/desativar empresa
 */
export function useToggleBusinessStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      businessId,
      isActive,
    }: {
      businessId: string;
      isActive: boolean;
    }) => {
      const result = await AdminService.toggleBusinessStatus(businessId, isActive);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.businesses() });
      queryClient.invalidateQueries({ queryKey: adminKeys.platformStats() });
      toast.success('Status atualizado com sucesso');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar status: ${error.message}`);
    },
  });
}

/**
 * Hook para atualizar plano de empresa
 */
export function useUpdateBusinessPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      businessId,
      planTier,
    }: {
      businessId: string;
      planTier: string;
    }) => {
      const result = await AdminService.updateBusinessPlan(businessId, planTier);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.businesses() });
      queryClient.invalidateQueries({ queryKey: adminKeys.planUsage() });
      queryClient.invalidateQueries({ queryKey: adminKeys.platformStats() });
      toast.success('Plano atualizado com sucesso');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar plano: ${error.message}`);
    },
  });
}
