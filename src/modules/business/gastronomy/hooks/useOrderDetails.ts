/**
 * useOrderDetails — Hook para buscar detalhes de um pedido
 *
 * SSOT: Consome OrderService do core/orders
 */

import { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { OrderService } from '@/modules/business/gastronomy/services/OrderService';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase';

export function useOrderDetails(orderId: string) {
  const queryClient = useQueryClient();
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

    const channel = supabase
      .channel(`gastronomy-order:${orderId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`,
        },
        invalidateOrder,
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'order_timeline_events',
          filter: `order_id=eq.${orderId}`,
        },
        invalidateOrder,
      )
      .subscribe((status) => {
        setIsRealtimeConnected(status === 'SUBSCRIBED');
      });

    return () => {
      if (invalidateTimerRef.current) {
        clearTimeout(invalidateTimerRef.current);
        invalidateTimerRef.current = null;
      }
      setIsRealtimeConnected(false);
      void supabase.removeChannel(channel);
    };
  }, [orderId, queryClient]);

  // Mutation: Atualizar notas internas
  const updateNotesMutation = useMutation({
    mutationFn: async (notes: string) => {
      const result = await OrderService.updateInternalNotes(orderId, notes);
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

