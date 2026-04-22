/**
 * useBusinessHours — Hook para gerenciar horários de funcionamento
 *
 * SSOT: Consome BusinessHoursService do core/business
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BusinessHoursService, type BusinessHours } from '@/core/business';
import { toast } from 'sonner';

export function useBusinessHours(businessId: string) {
  const queryClient = useQueryClient();

  // Query: Listar horários
  const { data: hours, isLoading, error } = useQuery({
    queryKey: ['business-hours', businessId],
    queryFn: async () => {
      const result = await BusinessHoursService.listHours(businessId);
      if (result.error) throw new Error(result.error);
      return result.data || [];
    },
    enabled: !!businessId,
  });

  // Mutation: Definir horário de um dia
  const setDayHoursMutation = useMutation({
    mutationFn: async (input: {
      day_of_week: number;
      opens_at: string;
      closes_at: string;
      is_closed?: boolean;
    }) => {
      const result = await BusinessHoursService.setDayHours({
        business_id: businessId,
        ...input,
      });
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-hours', businessId] });
      queryClient.invalidateQueries({ queryKey: ['business-status', businessId] });
      toast.success('Horário atualizado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar horário: ${error.message}`);
    },
  });

  // Mutation: Definir horários em lote
  const setBulkHoursMutation = useMutation({
    mutationFn: async (
      hours: Array<{
        day_of_week: number;
        opens_at: string;
        closes_at: string;
        is_closed: boolean;
      }>
    ) => {
      const result = await BusinessHoursService.setBulkHours(businessId, hours);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-hours', businessId] });
      queryClient.invalidateQueries({ queryKey: ['business-status', businessId] });
      toast.success('Horários atualizados com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar horários: ${error.message}`);
    },
  });

  return {
    hours,
    isLoading,
    error,
    setDayHours: setDayHoursMutation.mutate,
    setBulkHours: setBulkHoursMutation.mutate,
    isSettingHours: setDayHoursMutation.isPending || setBulkHoursMutation.isPending,
  };
}
