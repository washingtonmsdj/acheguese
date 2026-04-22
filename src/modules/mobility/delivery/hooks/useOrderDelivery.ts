/**
 * Hook SSOT para operacoes de pedido/entrega no modulo vertical delivery.
 */

import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSessionContext } from "@/core/session";
import { toast } from "sonner";
import { DELIVERY_QUERY_KEYS } from "../constants/queryKeys";
import type {
  AttachDeliveryProofInput,
  CreateOrderInput,
  OrderOperationResult,
  OrderRecord,
  ReportDeliveryOccurrenceInput,
  TransitionFinancialStatusInput,
} from "../order/types";
import type { DeliveryOccurrence } from "../incidents/types";
import { OrderDeliverySSOTService } from "../services/OrderDeliverySSOTService";

interface UseOrderDeliveryOptions {
  orderId?: string;
}

type MutationToastVariant = "success" | "warning" | "error";

interface MutationConfig<T> {
  execute: (actorProfileId: string) => Promise<OrderOperationResult<T>>;
  targetOrderId?:
    | string
    | ((result: OrderOperationResult<T>) => string | null | undefined);
  successMessage?: string;
  successVariant?: MutationToastVariant;
  errorMessage: string;
}

const ACTIVE_PROFILE_REQUIRED_MESSAGE =
  "Selecione um perfil ativo para operar pedidos e entregas.";

function missingActorResult<T>(): OrderOperationResult<T> {
  return {
    success: false,
    error: ACTIVE_PROFILE_REQUIRED_MESSAGE,
  };
}

function showToast(variant: MutationToastVariant, message: string): void {
  if (variant === "warning") {
    toast.warning(message);
    return;
  }

  if (variant === "error") {
    toast.error(message);
    return;
  }

  toast.success(message);
}

export function useOrderDelivery(options: UseOrderDeliveryOptions = {}) {
  const { orderId } = options;
  const { activeProfile } = useSessionContext();
  const queryClient = useQueryClient();

  const orderQuery = useQuery({
    queryKey: orderId ? DELIVERY_QUERY_KEYS.order(orderId) : ["delivery", "order", "none"],
    queryFn: async () => {
      if (!orderId) return null;
      const result = await OrderDeliverySSOTService.getOrderById(orderId);
      if (!result.success) throw new Error(result.error || "Erro ao buscar pedido.");
      return result.data || null;
    },
    enabled: !!orderId,
  });

  const timelineQuery = useQuery({
    queryKey: orderId
      ? DELIVERY_QUERY_KEYS.orderTimeline(orderId)
      : ["delivery", "order", "none", "timeline"],
    queryFn: async () => {
      if (!orderId) return [];
      const result = await OrderDeliverySSOTService.listTimeline(orderId);
      if (!result.success) throw new Error(result.error || "Erro ao buscar timeline.");
      return result.data || [];
    },
    enabled: !!orderId,
  });

  const incidentsQuery = useQuery({
    queryKey: orderId
      ? DELIVERY_QUERY_KEYS.orderIncidents(orderId)
      : ["delivery", "order", "none", "incidents"],
    queryFn: async () => {
      if (!orderId) return [];
      const result = await OrderDeliverySSOTService.listDeliveryOccurrences(orderId);
      if (!result.success) throw new Error(result.error || "Erro ao buscar ocorrencias.");
      return result.data || [];
    },
    enabled: !!orderId,
  });

  const invalidateOrderData = useCallback(
    async (targetOrderId: string) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: DELIVERY_QUERY_KEYS.order(targetOrderId),
        }),
        queryClient.invalidateQueries({
          queryKey: DELIVERY_QUERY_KEYS.orderTimeline(targetOrderId),
        }),
        queryClient.invalidateQueries({
          queryKey: DELIVERY_QUERY_KEYS.orderIncidents(targetOrderId),
        }),
      ]);
    },
    [queryClient],
  );

  const requireActorProfileId = useCallback(() => {
    const actorProfileId = activeProfile?.id;
    if (!actorProfileId) {
      toast.error(ACTIVE_PROFILE_REQUIRED_MESSAGE);
      return null;
    }
    return actorProfileId;
  }, [activeProfile?.id]);

  const executeMutation = useCallback(
    async <T,>(config: MutationConfig<T>): Promise<OrderOperationResult<T>> => {
      const actorProfileId = requireActorProfileId();
      if (!actorProfileId) return missingActorResult<T>();

      const result = await config.execute(actorProfileId);

      if (!result.success) {
        toast.error(result.error || config.errorMessage);
        return result;
      }

      let targetOrderId: string | null | undefined = undefined;
      if (typeof config.targetOrderId === "function") {
        targetOrderId = config.targetOrderId(result);
      } else {
        targetOrderId = config.targetOrderId;
      }

      if (targetOrderId) {
        await invalidateOrderData(targetOrderId);
      }

      if (config.successMessage) {
        showToast(config.successVariant ?? "success", config.successMessage);
      }

      return result;
    },
    [invalidateOrderData, requireActorProfileId],
  );

  const createOrder = useCallback(
    async (data: Omit<CreateOrderInput, "actor_profile_id">) =>
      executeMutation<OrderRecord>({
        execute: (actorProfileId) =>
          OrderDeliverySSOTService.createOrder({
            ...data,
            actor_profile_id: actorProfileId,
          }),
        targetOrderId: (result) => result.data?.id,
        successMessage: "Pedido criado com sucesso.",
        errorMessage: "Falha ao criar pedido.",
      }),
    [executeMutation],
  );

  const acceptOrder = useCallback(
    async (targetOrderId: string) =>
      executeMutation<OrderRecord>({
        execute: (actorProfileId) =>
          OrderDeliverySSOTService.acceptOrder(targetOrderId, actorProfileId),
        targetOrderId,
        successMessage: "Pedido aceito.",
        errorMessage: "Falha ao aceitar pedido.",
      }),
    [executeMutation],
  );

  const startPreparing = useCallback(
    async (targetOrderId: string) =>
      executeMutation<OrderRecord>({
        execute: (actorProfileId) =>
          OrderDeliverySSOTService.startPreparing(targetOrderId, actorProfileId),
        targetOrderId,
        successMessage: "Pedido em preparo.",
        errorMessage: "Falha ao iniciar preparo.",
      }),
    [executeMutation],
  );

  const markReadyForPickup = useCallback(
    async (targetOrderId: string) =>
      executeMutation<OrderRecord>({
        execute: (actorProfileId) =>
          OrderDeliverySSOTService.markReadyForPickup(targetOrderId, actorProfileId),
        targetOrderId,
        successMessage: "Pedido pronto para retirada.",
        errorMessage: "Falha ao marcar como pronto.",
      }),
    [executeMutation],
  );

  const markPickedUp = useCallback(
    async (targetOrderId: string, courierProfileId?: string) =>
      executeMutation<OrderRecord>({
        execute: (actorProfileId) =>
          OrderDeliverySSOTService.markPickedUp({
            order_id: targetOrderId,
            courier_profile_id: courierProfileId,
            actor_profile_id: actorProfileId,
          }),
        targetOrderId,
        successMessage: "Pedido retirado.",
        errorMessage: "Falha ao marcar retirada.",
      }),
    [executeMutation],
  );

  const markDelivered = useCallback(
    async (
      targetOrderId: string,
      input?: { proof?: AttachDeliveryProofInput["proof"]; reason?: string },
    ) =>
      executeMutation<OrderRecord>({
        execute: (actorProfileId) =>
          OrderDeliverySSOTService.markDelivered({
            order_id: targetOrderId,
            proof: input?.proof,
            reason: input?.reason,
            actor_profile_id: actorProfileId,
          }),
        targetOrderId,
        successMessage: "Pedido entregue.",
        errorMessage: "Falha ao marcar entrega.",
      }),
    [executeMutation],
  );

  const cancelOrder = useCallback(
    async (targetOrderId: string, reason?: string) =>
      executeMutation<OrderRecord>({
        execute: (actorProfileId) =>
          OrderDeliverySSOTService.cancelOrder({
            order_id: targetOrderId,
            reason,
            actor_profile_id: actorProfileId,
          }),
        targetOrderId,
        successMessage: "Pedido cancelado.",
        errorMessage: "Falha ao cancelar pedido.",
      }),
    [executeMutation],
  );

  const failOrder = useCallback(
    async (targetOrderId: string, reason?: string) =>
      executeMutation<OrderRecord>({
        execute: (actorProfileId) =>
          OrderDeliverySSOTService.failOrder({
            order_id: targetOrderId,
            reason,
            actor_profile_id: actorProfileId,
          }),
        targetOrderId,
        successMessage: "Falha de entrega registrada.",
        successVariant: "error",
        errorMessage: "Falha ao registrar falha de entrega.",
      }),
    [executeMutation],
  );

  const transitionFinancialStatus = useCallback(
    async (
      targetOrderId: string,
      toStatus: TransitionFinancialStatusInput["to_status"],
      reason?: string,
      metadata?: Record<string, unknown>,
    ) =>
      executeMutation<OrderRecord>({
        execute: (actorProfileId) =>
          OrderDeliverySSOTService.transitionFinancialStatus({
            order_id: targetOrderId,
            to_status: toStatus,
            reason,
            metadata,
            actor_profile_id: actorProfileId,
          }),
        targetOrderId,
        successMessage: "Status financeiro atualizado.",
        errorMessage: "Falha ao atualizar status financeiro.",
      }),
    [executeMutation],
  );

  const attachDeliveryProof = useCallback(
    async (targetOrderId: string, proof: AttachDeliveryProofInput["proof"]) =>
      executeMutation<OrderRecord>({
        execute: (actorProfileId) =>
          OrderDeliverySSOTService.attachDeliveryProof({
            order_id: targetOrderId,
            proof,
            actor_profile_id: actorProfileId,
          }),
        targetOrderId,
        successMessage: "Prova de entrega anexada.",
        errorMessage: "Falha ao anexar prova de entrega.",
      }),
    [executeMutation],
  );

  const reportIncident = useCallback(
    async (
      targetOrderId: string,
      payload: Omit<ReportDeliveryOccurrenceInput, "order_id" | "actor_profile_id">,
    ) =>
      executeMutation<DeliveryOccurrence>({
        execute: (actorProfileId) =>
          OrderDeliverySSOTService.reportDeliveryOccurrence({
            order_id: targetOrderId,
            actor_profile_id: actorProfileId,
            ...payload,
          }),
        targetOrderId,
        successMessage: "Ocorrencia registrada.",
        successVariant: "warning",
        errorMessage: "Falha ao registrar ocorrencia.",
      }),
    [executeMutation],
  );

  const resolveIncident = useCallback(
    async (
      targetOrderId: string,
      occurrenceId: string,
      resolutionNotes: string,
    ) =>
      executeMutation<DeliveryOccurrence>({
        execute: (actorProfileId) =>
          OrderDeliverySSOTService.resolveDeliveryOccurrence({
            order_id: targetOrderId,
            occurrence_id: occurrenceId,
            resolution_notes: resolutionNotes,
            actor_profile_id: actorProfileId,
          }),
        targetOrderId,
        successMessage: "Ocorrencia resolvida.",
        errorMessage: "Falha ao resolver ocorrencia.",
      }),
    [executeMutation],
  );

  return {
    order: orderQuery.data || null,
    timeline: timelineQuery.data || [],
    incidents: incidentsQuery.data || [],
    isLoading:
      orderQuery.isLoading || timelineQuery.isLoading || incidentsQuery.isLoading,
    isFetching:
      orderQuery.isFetching || timelineQuery.isFetching || incidentsQuery.isFetching,
    refetchOrder: orderQuery.refetch,
    refetchTimeline: timelineQuery.refetch,
    refetchIncidents: incidentsQuery.refetch,
    createOrder,
    acceptOrder,
    startPreparing,
    markReadyForPickup,
    markPickedUp,
    markDelivered,
    cancelOrder,
    failOrder,
    transitionFinancialStatus,
    attachDeliveryProof,
    reportIncident,
    resolveIncident,
  };
}
