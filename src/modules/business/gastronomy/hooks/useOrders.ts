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
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

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
  const verifiedBusinessOrderIdsRef = useRef<Set<string>>(new Set());
  const rememberVerifiedBusinessOrderId = (orderId: string) => {
    const cache = verifiedBusinessOrderIdsRef.current;
    if (cache.size >= 1000 && !cache.has(orderId)) {
      cache.clear();
    }
    cache.add(orderId);
  };

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
    if (!orders?.length) return;
    for (const order of orders) {
      rememberVerifiedBusinessOrderId(order.id);
    }
  }, [orders]);
  useEffect(() => {
    if (!businessId) return;
    verifiedBusinessOrderIdsRef.current.clear();

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

    const invalidateOrdersFromTimeline = async (
      payload: RealtimePostgresChangesPayload<{ order_id?: string | null }>,
    ) => {
      const orderId =
        typeof payload.new?.order_id === 'string'
          ? payload.new.order_id
          : typeof payload.old?.order_id === 'string'
            ? payload.old.order_id
            : null;

      // Filtra por vinculo canonical (orders.source_id = businessId),
      // evitando ruído sem perder pedidos que acabaram de entrar no filtro atual.
      if (!orderId) return;
      if (verifiedBusinessOrderIdsRef.current.has(orderId)) {
        invalidateOrders();
        return;
      }
      const isBusinessOrder = await GastronomyOrderRealtimeService.orderBelongsToBusiness(orderId, businessId);
      if (!isBusinessOrder) return;
      rememberVerifiedBusinessOrderId(orderId);
      invalidateOrders();
    };

    const channel = GastronomyOrderRealtimeService.subscribeBusinessOrders(
      businessId,
      invalidateOrders,
      invalidateOrdersFromTimeline,
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
    mutationFn: async (input: Parameters<typeof OrderService.createOrder>[0]) => {
      const result = await OrderService.createOrder(input);
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

  // Mutation: Atualizar status
  const updateStatusMutation = useMutation({
    mutationFn: async (input: { orderId: string; status: OrderStatus; notes?: string }) => {
      const result = await OrderService.updateOrderStatus(
        input.orderId,
        input.status,
        input.notes,
        activeProfile?.id
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
      const result = await OrderService.cancelOrder(input.orderId, input.reason, activeProfile?.id);
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

