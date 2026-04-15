/**
 * useDeliveryRequests — Hook para gerenciar solicitações de entrega
 *
 * Consome DeliveryService (SSOT).
 * NÃO acessa Supabase diretamente.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DeliveryService, DeliveryRequestStatus } from '@/core/delivery/DeliveryService';
import { toast } from 'sonner';

// ── Query Keys ────────────────────────────────────────────────────────────

export const deliveryKeys = {
  all: ['delivery-requests'] as const,
  lists: () => [...deliveryKeys.all, 'list'] as const,
  list: (businessId: string, filters?: any) =>
    [...deliveryKeys.lists(), businessId, filters] as const,
  details: () => [...deliveryKeys.all, 'detail'] as const,
  detail: (id: string) => [...deliveryKeys.details(), id] as const,
  stats: (businessId: string, dateFrom?: string, dateTo?: string) =>
    [...deliveryKeys.all, 'stats', businessId, dateFrom, dateTo] as const,
};

// ── Hook ──────────────────────────────────────────────────────────────────

export function useDeliveryRequests(
  businessId: string,
  filters?: {
    status?: DeliveryRequestStatus;
    date_from?: string;
    date_to?: string;
    limit?: number;
  }
) {
  return useQuery({
    queryKey: deliveryKeys.list(businessId, filters),
    queryFn: async () => {
      const result = await DeliveryService.listDeliveryRequests(businessId, filters);
      if (result.error) throw new Error(result.error);
      return result.data || [];
    },
    refetchInterval: 30000, // Refetch a cada 30 segundos
  });
}

export function useDeliveryRequest(requestId: string) {
  return useQuery({
    queryKey: deliveryKeys.detail(requestId),
    queryFn: async () => {
      const result = await DeliveryService.getDeliveryRequest(requestId);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    enabled: !!requestId,
    refetchInterval: 10000, // Refetch a cada 10 segundos para rastreamento
  });
}

export function useDeliveryStats(
  businessId: string,
  dateFrom?: string,
  dateTo?: string
) {
  return useQuery({
    queryKey: deliveryKeys.stats(businessId, dateFrom, dateTo),
    queryFn: async () => {
      const result = await DeliveryService.getDeliveryStats(businessId, dateFrom, dateTo);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    refetchInterval: 60000, // Refetch a cada 1 minuto
  });
}

// ── Mutations ─────────────────────────────────────────────────────────────

export function useCreateDeliveryRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: Parameters<typeof DeliveryService.createDeliveryRequest>[0]) => {
      const result = await DeliveryService.createDeliveryRequest(input);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: deliveryKeys.list(variables.business_id) });
      queryClient.invalidateQueries({ queryKey: deliveryKeys.stats(variables.business_id) });
      toast.success('Solicitação de entrega criada com sucesso');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar solicitação: ${error.message}`);
    },
  });
}

export function useUpdateDeliveryStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      requestId,
      status,
      notes,
    }: {
      requestId: string;
      status: DeliveryRequestStatus;
      notes?: string;
    }) => {
      const result = await DeliveryService.updateDeliveryStatus(requestId, status, notes);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: deliveryKeys.detail(data!.id) });
      queryClient.invalidateQueries({ queryKey: deliveryKeys.list(data!.business_id) });
      queryClient.invalidateQueries({ queryKey: deliveryKeys.stats(data!.business_id) });
      toast.success('Status atualizado com sucesso');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar status: ${error.message}`);
    },
  });
}

export function useCancelDeliveryRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      requestId,
      reason,
    }: {
      requestId: string;
      reason: string;
    }) => {
      const result = await DeliveryService.cancelDeliveryRequest(requestId, reason);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: deliveryKeys.detail(data!.id) });
      queryClient.invalidateQueries({ queryKey: deliveryKeys.list(data!.business_id) });
      queryClient.invalidateQueries({ queryKey: deliveryKeys.stats(data!.business_id) });
      toast.success('Entrega cancelada');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao cancelar entrega: ${error.message}`);
    },
  });
}

export function useAcceptDeliveryRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      requestId,
      driverProfileId,
      driverPayment,
    }: {
      requestId: string;
      driverProfileId: string;
      driverPayment?: number;
    }) => {
      const result = await DeliveryService.acceptDeliveryRequest(requestId, driverProfileId, driverPayment);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: deliveryKeys.detail(data!.id) });
      queryClient.invalidateQueries({ queryKey: deliveryKeys.lists() });
      toast.success('Entrega aceita com sucesso');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao aceitar entrega: ${error.message}`);
    },
  });
}

export function useAddTrackingPoint() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: Parameters<typeof DeliveryService.addTrackingPoint>[0]) => {
      const result = await DeliveryService.addTrackingPoint(input);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: deliveryKeys.detail(data!.delivery_request_id),
      });
    },
    onError: (error: Error) => {
      console.error('Erro ao adicionar ponto de rastreamento:', error.message);
    },
  });
}

