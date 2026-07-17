/**
 * useOrders — Hook para gerenciar pedidos
 *
 * SSOT: Consome OrderService do core/orders
 */

import { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { OrderService, type Order, type OrderStatus, type OrderType } from '@/modules/business/gastronomy/services/OrderService';
import { GastronomyOrderRealtimeService } from '@/modules/business/gastronomy/services/GastronomyOrderRealtimeService';
import { toast } from 'sonner';
import { useSessionContext } from '@/core/session';

interface UseOrdersFilters {
  status?: OrderStatus;
  order_type?: OrderType;
  date_from?: string;
  date_to?: string;
  limit?: number;
}

export function useOrders(businessId: string, filters?: UseOrdersFilters) {
  const queryClient = useQueryClient();
  const { activeProfile } = useSessionContext();
  const ordersQueryKey = ['orders', businessId, filters] as const;
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [lastRealtimeEventAt, setLastRealtimeEventAt] = useState<string | null>(null);
  const invalidateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Query: Listar pedidos
  const { data: orders, isLoading, error, refetch } = useQuery({
    queryKey: ordersQueryKey,
    queryFn: async () => {
      const result = await OrderService.listOrders(businessId, filters);
      if (result.error) throw new Error(result.error);
      return result.data || [];
    },
    enabled: !!businessId,
  });

  useEffect(() => {
    if (!businessId) return;

    const invalidateOrders = () => {
      setLastRealtimeEventAt(new Date().toISOString());
      if (invalidateTimerRef.current) {
        return;
      }
      invalidateTimerRef.current = setTimeout(() => {
        invalidateTimerRef.current = null;
        void queryClient.invalidateQueries({ queryKey: ['orders', businessId] });
        void queryClient.invalidateQueries({ queryKey: ['order-stats', businessId] });
      }, 250);
    };

    const channel = GastronomyOrderRealtimeService.subscribeBusinessOrders(
      businessId,
      invalidateOrders,
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
  }, [businessId, queryClient]);

  // Mutation: Criar pedido
  const createOrderMutation = useMutation({
    mutationFn: async () => {
      const result = await OrderService.createOrder();
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', businessId] });
      queryClient.invalidateQueries({ queryKey: ['order-stats', businessId] });
      toast.success('Pedido criado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar pedido: ${error.message}`);
    },
  });

  const resolveActorProfileId = (orderId: string) => {
    const cachedOrder = queryClient.getQueryData<Order>(['order', orderId]);
    const cachedOrders = queryClient.getQueryData<Order[]>(ordersQueryKey);
    const matchingOrder =
      cachedOrder ??
      cachedOrders?.find((entry) => entry.id === orderId) ??
      orders?.find((entry) => entry.id === orderId);

    return matchingOrder?.merchant_profile_id || activeProfile?.id;
  };

  // Mutation: Atualizar status
  const updateStatusMutation = useMutation({
    mutationFn: async (input: { orderId: string; status: OrderStatus; notes?: string }) => {
      const actorProfileId = resolveActorProfileId(input.orderId);
      const result = await OrderService.updateOrderStatus(
        input.orderId,
        input.status,
        input.notes,
        actorProfileId,
      );
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['orders', businessId] });
      queryClient.invalidateQueries({ queryKey: ['order', variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ['order-stats', businessId] });
      toast.success('Status atualizado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar status: ${error.message}`);
    },
  });

  // Mutation: Cancelar pedido
  const cancelOrderMutation = useMutation({
    mutationFn: async (input: { orderId: string; reason: string }) => {
      const actorProfileId = resolveActorProfileId(input.orderId);
      const result = await OrderService.cancelOrder(input.orderId, input.reason, actorProfileId);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['orders', businessId] });
      queryClient.invalidateQueries({ queryKey: ['order', variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ['order-stats', businessId] });
      toast.success('Pedido cancelado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao cancelar pedido: ${error.message}`);
    },
  });

  return {
    orders,
    isLoading,
    error,
    refetch,
    createOrder: createOrderMutation.mutate,
    updateStatus: updateStatusMutation.mutate,
    cancelOrder: cancelOrderMutation.mutate,
    isCreating: createOrderMutation.isPending,
    isUpdatingStatus: updateStatusMutation.isPending,
    isCancelling: cancelOrderMutation.isPending,
    isRealtimeConnected,
    lastRealtimeEventAt,
  };
}

