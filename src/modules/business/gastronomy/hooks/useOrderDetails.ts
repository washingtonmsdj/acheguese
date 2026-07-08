/**
 * useOrderDetails — Hook para buscar detalhes de um pedido
 *
 * SSOT: Consome OrderService do core/orders
 */

import { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { OrderService } from '@/modules/business/gastronomy/services/OrderService';
import { GastronomyOrderRealtimeService } from '@/modules/business/gastronomy/services/GastronomyOrderRealtimeService';
import { toast } from 'sonner';
import { useSessionContext } from '@/core/session';

export function useOrderDetails(orderId: string) {
  const queryClient = useQueryClient();
  const { activeProfile } = useSessionContext();
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const invalidateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Query: Buscar pedido completo
  const { data: order, isLoading, error, refetch } = useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      const result = await OrderService.getOrder(orderId);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    enabled: !!orderId,
  });

  useEffect(() => {
    if (!orderId) return;

    const invalidateOrder = () => {
      if (invalidateTimerRef.current) {
        return;
      }
      invalidateTimerRef.current = setTimeout(() => {
        invalidateTimerRef.current = null;
        void queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      }, 250);
    };

    const channel = GastronomyOrderRealtimeService.subscribeOrderDetails(
      orderId,
      invalidateOrder,
      (status) => {
        setIsRealtimeConnected(status === 'SUBSCRIBED');
      },
    );

    return () => {
      if (invalidateTimerRef.current) {
        clearTimeout(invalidateTimerRef.current);
        invalidateTimerRef.current = null;
      }
      setIsRealtimeConnected(false);
      void GastronomyOrderRealtimeService.removeChannel(channel);
    };
  }, [orderId, queryClient]);

  // Mutation: Atualizar notas internas
  const updateNotesMutation = useMutation({
    mutationFn: async (notes: string) => {
      const actorProfileId = order?.merchant_profile_id || activeProfile?.id;
      const result = await OrderService.updateInternalNotes(orderId, notes, actorProfileId);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: (updatedOrder) => {
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      if (updatedOrder?.business_id) {
        queryClient.invalidateQueries({ queryKey: ['orders', updatedOrder.business_id] });
        queryClient.invalidateQueries({ queryKey: ['order-stats', updatedOrder.business_id] });
      }
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
    isRealtimeConnected,
  };
}

