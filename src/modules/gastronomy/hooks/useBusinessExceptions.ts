/**
 * useBusinessExceptions — Hook para gerenciar exceções de horário
 *
 * SSOT: Consome BusinessHoursService do core/business
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BusinessHoursService, type BusinessHoursException } from '@/core/business';
import { toast } from 'sonner';

export function useBusinessExceptions(businessId: string) {
  const queryClient = useQueryClient();

  // Query: Listar exceções
  const { data: exceptions, isLoading, error } = useQuery({
    queryKey: ['business-exceptions', businessId],
    queryFn: async () => {
      const result = await BusinessHoursService.listExceptions(businessId);
      if (result.error) throw new Error(result.error);
      return result.data || [];
    },
    enabled: !!businessId,
  });

  // Mutation: Criar/atualizar exceção
  const setExceptionMutation = useMutation({
    mutationFn: async (input: {
      business_id: string;
      date: string;
      opens_at?: string;
      closes_at?: string;
      is_closed: boolean;
      reason?: string;
    }) => {
      const result = await BusinessHoursService.setException(input);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-exceptions', businessId] });
      queryClient.invalidateQueries({ queryKey: ['business-status', businessId] });
      toast.success('Exceção salva com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao salvar exceção: ${error.message}`);
    },
  });

  // Mutation: Deletar exceção
  const deleteExceptionMutation = useMutation({
    mutationFn: async (exceptionId: string) => {
      const result = await BusinessHoursService.deleteException(exceptionId);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-exceptions', businessId] });
      queryClient.invalidateQueries({ queryKey: ['business-status', businessId] });
      toast.success('Exceção deletada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao deletar exceção: ${error.message}`);
    },
  });

  return {
    exceptions,
    isLoading,
    error,
    setException: setExceptionMutation.mutate,
    deleteException: deleteExceptionMutation.mutate,
    isSettingException: setExceptionMutation.isPending || deleteExceptionMutation.isPending,
  };
}
