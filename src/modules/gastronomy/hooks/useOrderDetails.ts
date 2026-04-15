/**
 * useOrderDetails — Hook para buscar detalhes de um pedido
 *
 * SSOT: Consome OrderService do core/orders
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { OrderService } from '@/core/orders';
import { toast } from 'sonner';

export function useOrderDetails(orderId: string) {
  const queryClient = useQueryClient();

  // Query: Buscar pedido completo
  const { data: order, isLoading, error, refetch } = useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      const result = await OrderService.getOrder(orderId);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    enabled: !!orderId,
    refetchInterval: 30000, // Refetch a cada 30 segundos
  });

  // Mutation: Atualizar notas internas
  const updateNotesMutation = useMutation({
    mutationFn: async (notes: string) => {
      const result = await OrderService.updateInternalNotes(orderId, notes);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      toast.success('Notas atualizadas com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar notas: ${error.message}`);
    },
  });

  return {
    order,
    isLoading,
    error,
    refetch,
    updateNotes: updateNotesMutation.mutate,
    isUpdatingNotes: updateNotesMutation.isPending,
  };
}
