/**
 * useDeliveryAreas — Hook para gerenciar áreas de entrega
 *
 * SSOT: Consome DeliveryAreaService do core/delivery
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DeliveryAreaService, type DeliveryArea } from '@/modules/business/gastronomy/services/DeliveryAreaService';
import { toast } from 'sonner';

export function useDeliveryAreas(businessId: string) {
  const queryClient = useQueryClient();

  // Query: Listar áreas
  const { data: areas, isLoading, error } = useQuery({
    queryKey: ['delivery-areas', businessId],
    queryFn: async () => {
      const result = await DeliveryAreaService.listAreas(businessId);
      if (result.error) throw new Error(result.error);
      return result.data || [];
    },
    enabled: !!businessId,
  });

  // Mutation: Criar área
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
      toast.success('Área de entrega criada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar área: ${error.message}`);
    },
  });

  // Mutation: Atualizar área
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
      toast.success('Área atualizada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar área: ${error.message}`);
    },
  });

  // Mutation: Deletar área
  const deleteAreaMutation = useMutation({
    mutationFn: async (areaId: string) => {
      const result = await DeliveryAreaService.deleteArea(areaId);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-areas', businessId] });
      queryClient.invalidateQueries({ queryKey: ['delivery-summary', businessId] });
      toast.success('Área deletada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao deletar área: ${error.message}`);
    },
  });

  // Mutation: Reordenar áreas
  const reorderAreasMutation = useMutation({
    mutationFn: async (areaIds: string[]) => {
      const result = await DeliveryAreaService.reorderAreas(businessId, areaIds);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-areas', businessId] });
      toast.success('Áreas reordenadas com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao reordenar áreas: ${error.message}`);
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

