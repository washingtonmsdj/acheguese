/**
 * useDeliveryNeighborhoods — Hook para gerenciar bairros de uma área
 *
 * SSOT: Consome DeliveryAreaService do core/delivery
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DeliveryAreaService, type DeliveryNeighborhood } from '@/core/business/services/GastronomyDeliveryAreaService';
import { toast } from 'sonner';

export function useDeliveryNeighborhoods(areaId: string) {
  const queryClient = useQueryClient();

  // Query: Listar bairros
  const { data: neighborhoods, isLoading, error } = useQuery({
    queryKey: ['delivery-neighborhoods', areaId],
    queryFn: async () => {
      const result = await DeliveryAreaService.listNeighborhoods(areaId);
      if (result.error) throw new Error(result.error);
      return result.data || [];
    },
    enabled: !!areaId,
  });

  // Mutation: Adicionar bairro
  const addNeighborhoodMutation = useMutation({
    mutationFn: async (input: {
      neighborhood_name: string;
      city: string;
      state: string;
      custom_delivery_fee?: number;
      custom_minimum_order?: number;
      custom_estimated_time?: number;
    }) => {
      const result = await DeliveryAreaService.addNeighborhood({
        delivery_area_id: areaId,
        ...input,
      });
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-neighborhoods', areaId] });
      toast.success('Bairro adicionado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao adicionar bairro: ${error.message}`);
    },
  });

  // Mutation: Atualizar bairro
  const updateNeighborhoodMutation = useMutation({
    mutationFn: async (input: {
      neighborhoodId: string;
      data: Partial<Omit<DeliveryNeighborhood, 'id' | 'delivery_area_id' | 'created_at' | 'updated_at'>>;
    }) => {
      const result = await DeliveryAreaService.updateNeighborhood(input.neighborhoodId, input.data);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-neighborhoods', areaId] });
      toast.success('Bairro atualizado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar bairro: ${error.message}`);
    },
  });

  // Mutation: Deletar bairro
  const deleteNeighborhoodMutation = useMutation({
    mutationFn: async (neighborhoodId: string) => {
      const result = await DeliveryAreaService.deleteNeighborhood(neighborhoodId);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-neighborhoods', areaId] });
      toast.success('Bairro removido com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao remover bairro: ${error.message}`);
    },
  });

  // Mutation: Adicionar múltiplos bairros
  const addNeighborhoodsBulkMutation = useMutation({
    mutationFn: async (
      neighborhoods: Array<{
        neighborhood_name: string;
        city: string;
        state: string;
      }>
    ) => {
      const result = await DeliveryAreaService.addNeighborhoodsBulk(areaId, neighborhoods);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-neighborhoods', areaId] });
      toast.success('Bairros adicionados com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao adicionar bairros: ${error.message}`);
    },
  });

  return {
    neighborhoods,
    isLoading,
    error,
    addNeighborhood: addNeighborhoodMutation.mutate,
    updateNeighborhood: updateNeighborhoodMutation.mutate,
    deleteNeighborhood: deleteNeighborhoodMutation.mutate,
    addNeighborhoodsBulk: addNeighborhoodsBulkMutation.mutate,
    isAdding: addNeighborhoodMutation.isPending || addNeighborhoodsBulkMutation.isPending,
    isUpdating: updateNeighborhoodMutation.isPending,
    isDeleting: deleteNeighborhoodMutation.isPending,
  };
}

