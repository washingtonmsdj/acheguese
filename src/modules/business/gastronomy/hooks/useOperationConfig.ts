/**
 * useOperationConfig — Hook para gerenciar configuração operacional
 *
 * SSOT: Consome BusinessHoursService do core/business
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BusinessHoursService, type BusinessOperationConfig } from '@/core/business';
import { toast } from 'sonner';

export function useOperationConfig(businessId: string) {
  const queryClient = useQueryClient();

  // Query: Buscar configuração
  const { data: config, isLoading, error } = useQuery({
    queryKey: ['operation-config', businessId],
    queryFn: async () => {
      const result = await BusinessHoursService.getOperationConfig(businessId);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    enabled: !!businessId,
  });

  // Mutation: Atualizar configuração
  const updateMutation = useMutation({
    mutationFn: async (input: Partial<Omit<BusinessOperationConfig, 'id' | 'business_id' | 'created_at' | 'updated_at'>>) => {
      const result = await BusinessHoursService.setOperationConfig({
        business_id: businessId,
        ...input,
      });
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operation-config', businessId] });
      queryClient.invalidateQueries({ queryKey: ['business-status', businessId] });
      toast.success('Configuração atualizada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar configuração: ${error.message}`);
    },
  });

  return {
    config,
    isLoading,
    error,
    updateConfig: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
  };
}
