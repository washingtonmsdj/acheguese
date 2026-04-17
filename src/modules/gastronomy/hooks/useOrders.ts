/**
 * useOrders â€” Hook para gerenciar pedidos
 *
 * SSOT: Consome OrderService do core/orders
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { OrderService, type Order, type OrderStatus, type OrderType } from '@/modules/gastronomy/services/OrderService';
import { toast } from 'sonner';

interface UseOrdersFilters {
  status?: OrderStatus;
  order_type?: OrderType;
  date_from?: string;
  date_to?: string;
  limit?: number;
}

export function useOrders(businessId: string, filters?: UseOrdersFilters) {
  const queryClient = useQueryClient();

  // Query: Listar pedidos
  const { data: orders, isLoading, error, refetch } = useQuery({
    queryKey: ['orders', businessId, filters],
    queryFn: async () => {
      const result = await OrderService.listOrders(businessId, filters);
      if (result.error) throw new Error(result.error);
      return result.data || [];
    },
    enabled: !!businessId,
    refetchInterval: 30000, // Refetch a cada 30 segundos
  });

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
        input.notes
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
      const result = await OrderService.cancelOrder(input.orderId, input.reason);
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
  };
}

