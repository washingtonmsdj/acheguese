/**
 * useDeliveryAreas â€” Hook para gerenciar Ã¡reas de entrega
 *
 * SSOT: Consome DeliveryAreaService do core/delivery
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DeliveryAreaService, type DeliveryArea } from '@/modules/gastronomy/services/DeliveryAreaService';
import { toast } from 'sonner';

export function useDeliveryAreas(businessId: string) {
  const queryClient = useQueryClient();

  // Query: Listar Ã¡reas
  const { data: areas, isLoading, error } = useQuery({
    queryKey: ['delivery-areas', businessId],
    queryFn: async () => {
      const result = await DeliveryAreaService.listAreas(businessId);
      if (result.error) throw new Error(result.error);
      return result.data || [];
    },
    enabled: !!businessId,
  });

  // Mutation: Criar Ã¡rea
  const createAreaMutation = useMutation({
    mutationFn: async (input: {
      name: string;
      description?: string;
      delivery_fee: number;
      minimum_order_value?: number;
      estimated_time_min?: number;
    }) => {
      const result = await DeliveryAreaService.createArea({
        business_id: businessId,
        ...input,
      });
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-areas', businessId] });
      queryClient.invalidateQueries({ queryKey: ['delivery-summary', businessId] });
      toast.success('Ãrea de entrega criada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar Ã¡rea: ${error.message}`);
    },
  });

  // Mutation: Atualizar Ã¡rea
  const updateAreaMutation = useMutation({
    mutationFn: async (input: {
      areaId: string;
      data: Partial<Omit<DeliveryArea, 'id' | 'business_id' | 'created_at' | 'updated_at'>>;
    }) => {
      const result = await DeliveryAreaService.updateArea(input.areaId, input.data);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-areas', businessId] });
      queryClient.invalidateQueries({ queryKey: ['delivery-summary', businessId] });
      toast.success('Ãrea atualizada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar Ã¡rea: ${error.message}`);
    },
  });

  // Mutation: Deletar Ã¡rea
  const deleteAreaMutation = useMutation({
    mutationFn: async (areaId: string) => {
      const result = await DeliveryAreaService.deleteArea(areaId);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-areas', businessId] });
      queryClient.invalidateQueries({ queryKey: ['delivery-summary', businessId] });
      toast.success('Ãrea deletada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao deletar Ã¡rea: ${error.message}`);
    },
  });

  // Mutation: Reordenar Ã¡reas
  const reorderAreasMutation = useMutation({
    mutationFn: async (areaIds: string[]) => {
      const result = await DeliveryAreaService.reorderAreas(businessId, areaIds);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-areas', businessId] });
      toast.success('Ãreas reordenadas com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao reordenar Ã¡reas: ${error.message}`);
    },
  });

  return {
    areas,
    isLoading,
    error,
    createArea: createAreaMutation.mutate,
    updateArea: updateAreaMutation.mutate,
    deleteArea: deleteAreaMutation.mutate,
    reorderAreas: reorderAreasMutation.mutate,
    isCreating: createAreaMutation.isPending,
    isUpdating: updateAreaMutation.isPending,
    isDeleting: deleteAreaMutation.isPending,
    isReordering: reorderAreasMutation.isPending,
  };
}

