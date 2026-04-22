/**
 * SSOT: módulo vertical de delivery/pedidos
 *
 * Fase ativa:
 * - payment_mode: direct_to_merchant
 * - delivery_mode: merchant_own_fleet
 *
 * Fase futura (preparada, mas não ativa):
 * - payment_mode: platform_checkout
 * - delivery_mode: platform_courier_network
 * - payout/split/settlement real
 */

import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import type {
  OrderActorRole,
  OrderTimelineEvent,
} from "../audit-timeline/types";
import { DELIVERY_MODE } from "../delivery/types";
import {
  type DeliveryOccurrence,
  type DeliveryOccurrenceSeverity,
} from "../incidents/types";
import type {
  AttachDeliveryProofInput,
  CreateOrderInput,
  CreateOrderItemInput,
  OrderOperationResult,
  OrderItemRecord,
  OrderRecord,
  OrderSourceContext,
  ReportDeliveryOccurrenceInput,
  ResolveDeliveryOccurrenceInput,
  TransitionFinancialStatusInput,
  TransitionLogisticsStatusInput,
} from "../order/types";
import { OrderDraftService } from "../order/OrderDraftService";
import { PaymentContextService } from "../payment-context/PaymentContextService";
import {
  FINANCIAL_STATUS,
  PAYMENT_MODE,
  type FinancialStatus,
} from "../payment-context/types";
import type { DeliveryProof } from "../proof-of-delivery/types";
import { LOGISTICS_STATUS, type LogisticsStatus } from "../logistics/types";
import { SettlementContextService } from "../settlement-context/SettlementContextService";
import type { OrderFinancialBreakdown } from "../settlement-context/types";

const ORDER_TABLE = "orders";
const ORDER_ITEMS_TABLE = "order_items";
const ORDER_TIMELINE_TABLE = "order_timeline_events";
const DELIVERY_OCCURRENCES_TABLE = "delivery_occurrences";

const DELIVERY_RPCS = {
  CREATE_ORDER: "delivery_create_order",
  TRANSITION_LOGISTICS_STATUS: "delivery_transition_logistics_status",
  MARK_PICKED_UP: "delivery_mark_picked_up",
  ATTACH_DELIVERY_PROOF: "delivery_attach_delivery_proof",
  MARK_DELIVERED: "delivery_mark_delivered",
  TRANSITION_FINANCIAL_STATUS: "delivery_transition_financial_status",
  REPORT_OCCURRENCE: "delivery_report_occurrence",
  RESOLVE_OCCURRENCE: "delivery_resolve_occurrence",
} as const;

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}

function asProof(value: unknown): DeliveryProof | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as DeliveryProof;
}

function parseFinancialBreakdown(row: Record<string, unknown>): OrderFinancialBreakdown {
  return {
    items_total: Number(row.items_total ?? 0),
    delivery_fee: Number(row.delivery_fee ?? 0),
    discount_total: Number(row.discount_total ?? 0),
    order_total: Number(row.order_total ?? 0),
    platform_fee_amount:
      row.platform_fee_amount === null || row.platform_fee_amount === undefined
        ? null
        : Number(row.platform_fee_amount),
    merchant_net_amount:
      row.merchant_net_amount === null || row.merchant_net_amount === undefined
        ? null
        : Number(row.merchant_net_amount),
    courier_amount:
      row.courier_amount === null || row.courier_amount === undefined
        ? null
        : Number(row.courier_amount),
  };
}

function asSourceContext(row: Record<string, unknown>): OrderSourceContext {
  return {
    source_type: (row.source_type as OrderSourceContext["source_type"]) ?? "manual",
    source_id: (row.source_id as string | null) ?? null,
    source_reference: (row.source_reference as string | null) ?? null,
    source_metadata: asRecord(row.source_metadata),
  };
}

function asOrderItem(row: Record<string, unknown>): OrderItemRecord {
  const itemSnapshot = asRecord(row.item_snapshot);

  return {
    id: String(row.id),
    order_id: String(row.order_id),
    source_item_id: (row.source_item_id as string | null) ?? null,
    sku: (row.sku as string | null) ?? null,
    name: String(row.name),
    quantity: Number(row.quantity ?? 0),
    unit_price: Number(row.unit_price ?? 0),
    addons_total: Number(row.addons_total ?? 0),
    line_total: Number(row.line_total ?? 0),
    notes: (row.notes as string | null) ?? null,
    item_snapshot: {
      ...itemSnapshot,
      addons: Array.isArray(itemSnapshot.addons)
        ? (itemSnapshot.addons as unknown[])
        : [],
    } as OrderItemRecord["item_snapshot"],
    metadata: asRecord(row.metadata),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

function asOrderRecord(
  row: Record<string, unknown>,
  items: OrderItemRecord[] = [],
): OrderRecord {
  const paymentMode = row.payment_mode as OrderRecord["payment_mode"];
  const deliveryMode = row.delivery_mode as OrderRecord["delivery_mode"];
  const breakdown = parseFinancialBreakdown(row);
  const settlementContext = SettlementContextService.buildSettlementContext({
    payment_mode: paymentMode,
    delivery_mode: deliveryMode,
    breakdown,
  });

  return {
    id: String(row.id),
    customer_profile_id: String(row.customer_profile_id),
    merchant_profile_id: String(row.merchant_profile_id),
    courier_profile_id: (row.courier_profile_id as string | null) ?? null,
    source_context: asSourceContext(row),
    payment_mode: paymentMode,
    delivery_mode: deliveryMode,
    logistics_status: row.logistics_status as OrderRecord["logistics_status"],
    financial_status: row.financial_status as OrderRecord["financial_status"],
    financial_breakdown: breakdown,
    settlement_context: settlementContext,
    items,
    payment_method: (row.payment_method as string | null) ?? null,
    external_payment_reference:
      (row.external_payment_reference as string | null) ?? null,
    notes: (row.notes as string | null) ?? null,
    proof_of_delivery: asProof(row.proof_of_delivery),
    failure_reason: (row.failure_reason as string | null) ?? null,
    accepted_at: (row.accepted_at as string | null) ?? null,
    preparing_at: (row.preparing_at as string | null) ?? null,
    ready_for_pickup_at: (row.ready_for_pickup_at as string | null) ?? null,
    picked_up_at: (row.picked_up_at as string | null) ?? null,
    delivered_at: (row.delivered_at as string | null) ?? null,
    canceled_at: (row.canceled_at as string | null) ?? null,
    failed_at: (row.failed_at as string | null) ?? null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

function asTimelineEvent(row: Record<string, unknown>): OrderTimelineEvent {
  return {
    id: String(row.id),
    order_id: String(row.order_id),
    event_type: String(row.event_type),
    from_logistics_status:
      (row.from_logistics_status as LogisticsStatus | null) ?? null,
    to_logistics_status: (row.to_logistics_status as LogisticsStatus | null) ?? null,
    from_financial_status:
      (row.from_financial_status as FinancialStatus | null) ?? null,
    to_financial_status: (row.to_financial_status as FinancialStatus | null) ?? null,
    actor_profile_id: (row.actor_profile_id as string | null) ?? null,
    actor_role: (row.actor_role as OrderActorRole) ?? "system",
    reason: (row.reason as string | null) ?? null,
    metadata: asRecord(row.metadata),
    created_at: String(row.created_at),
  };
}

function asOccurrence(row: Record<string, unknown>): DeliveryOccurrence {
  return {
    id: String(row.id),
    order_id: String(row.order_id),
    occurrence_type: row.occurrence_type as DeliveryOccurrence["occurrence_type"],
    severity: row.severity as DeliveryOccurrence["severity"],
    status: row.status as DeliveryOccurrence["status"],
    description: String(row.description),
    reported_by_profile_id: (row.reported_by_profile_id as string | null) ?? null,
    resolution_notes: (row.resolution_notes as string | null) ?? null,
    metadata: asRecord(row.metadata),
    occurred_at: String(row.occurred_at),
    resolved_at: (row.resolved_at as string | null) ?? null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Erro inesperado no módulo de pedidos/entregas.";
}

function normalizeRpcRow(data: unknown, rpcName: string): Record<string, unknown> {
  const row = Array.isArray(data) ? data[0] : data;
  if (!row || typeof row !== "object" || Array.isArray(row)) {
    throw new Error(`Resposta inválida do RPC ${rpcName}.`);
  }
  return row as Record<string, unknown>;
}

function normalizeProofInput(proof?: DeliveryProof): DeliveryProof | null {
  if (!proof) return null;
  return {
    ...proof,
    signed_at: proof.signed_at ?? new Date().toISOString(),
  };
}

function normalizeOrderItemsInput(
  items?: CreateOrderItemInput[],
): CreateOrderItemInput[] {
  return OrderDraftService.normalizeItems(items);
}

export class OrderDeliverySSOTService {
  private static assertCurrentDeliveryModeSupported(
    deliveryMode: OrderRecord["delivery_mode"],
  ): void {
    if (deliveryMode !== DELIVERY_MODE.MERCHANT_OWN_FLEET) {
      throw new Error(
        `delivery_mode=${deliveryMode} preparado no SSOT, mas ainda não está ativo na operação atual.`,
      );
    }
  }

  private static assertFinancialStatusSupportedNow(
    financialStatus: FinancialStatus,
  ): void {
    const payoutStatuses: FinancialStatus[] = [
      FINANCIAL_STATUS.PAYOUT_PENDING,
      FINANCIAL_STATUS.PAYOUT_SENT,
      FINANCIAL_STATUS.PAYOUT_FAILED,
    ];

    if (payoutStatuses.includes(financialStatus)) {
      throw new Error(
        "Status de payout/split existe no SSOT, mas a execução real de settlement ainda não está ativa.",
      );
    }
  }

  private static requireActorProfileId(actorProfileId?: string): string {
    if (!actorProfileId) {
      throw new Error(
        "actor_profile_id é obrigatório para operações mutáveis do módulo delivery.",
      );
    }

    return actorProfileId;
  }

  private static async getOrderRow(
    orderId: string,
  ): Promise<Record<string, unknown>> {
    const { data, error } = await (supabase as any)
      .from(ORDER_TABLE)
      .select("*")
      .eq("id", orderId)
      .single();

    if (error) throw error;
    return (data ?? {}) as Record<string, unknown>;
  }

  private static async getOrderItems(
    orderId: string,
  ): Promise<OrderItemRecord[]> {
    const { data, error } = await (supabase as any)
      .from(ORDER_ITEMS_TABLE)
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: true });

    if (error) throw error;

    return (data ?? []).map((row: Record<string, unknown>) => asOrderItem(row));
  }

  private static async hydrateOrderRecord(
    row: Record<string, unknown>,
  ): Promise<OrderRecord> {
    const orderId = String(row.id);
    const items = await this.getOrderItems(orderId);
    return asOrderRecord(row, items);
  }

  private static async invokeOrderRpc(
    rpcName: string,
    args: Record<string, unknown>,
  ): Promise<OrderRecord> {
    const { data, error } = await (supabase as any).rpc(rpcName, args);

    if (error) throw error;

    return this.hydrateOrderRecord(normalizeRpcRow(data, rpcName));
  }

  private static async invokeOccurrenceRpc(
    rpcName: string,
    args: Record<string, unknown>,
  ): Promise<DeliveryOccurrence> {
    const { data, error } = await (supabase as any).rpc(rpcName, args);

    if (error) throw error;

    return asOccurrence(normalizeRpcRow(data, rpcName));
  }

  static async createOrder(
    input: CreateOrderInput,
  ): Promise<OrderOperationResult<OrderRecord>> {
    try {
      const actorProfileId = this.requireActorProfileId(input.actor_profile_id);
      const paymentMode = input.payment_mode ?? PAYMENT_MODE.DIRECT_TO_MERCHANT;
      const deliveryMode = input.delivery_mode ?? DELIVERY_MODE.MERCHANT_OWN_FLEET;
      const sourceContext = OrderDraftService.normalizeSourceContext(
        input.source_context,
      );
      const items = normalizeOrderItemsInput(input.items);

      PaymentContextService.assertCurrentPaymentModeSupported(paymentMode);
      this.assertCurrentDeliveryModeSupported(deliveryMode);

      const breakdown = SettlementContextService.calculateFinancialBreakdown(
        input.financial,
      );
      OrderDraftService.assertItemsTotalMatchesFinancial(
        items,
        breakdown.items_total,
      );
      const initialFinancialStatus = PaymentContextService.resolveInitialFinancialStatus(
        paymentMode,
        input.initial_financial_status,
      );

      this.assertFinancialStatusSupportedNow(initialFinancialStatus);

      const order = await this.invokeOrderRpc(DELIVERY_RPCS.CREATE_ORDER, {
        p_customer_profile_id: input.customer_profile_id,
        p_merchant_profile_id: input.merchant_profile_id,
        p_courier_profile_id: input.courier_profile_id ?? null,
        p_payment_mode: paymentMode,
        p_delivery_mode: deliveryMode,
        p_financial_status: initialFinancialStatus,
        p_items_total: breakdown.items_total,
        p_delivery_fee: breakdown.delivery_fee,
        p_discount_total: breakdown.discount_total,
        p_order_total: breakdown.order_total,
        p_platform_fee_amount: breakdown.platform_fee_amount,
        p_merchant_net_amount: breakdown.merchant_net_amount,
        p_courier_amount: breakdown.courier_amount,
        p_source_type: sourceContext.source_type,
        p_source_id: sourceContext.source_id ?? null,
        p_source_reference: sourceContext.source_reference ?? null,
        p_source_metadata: sourceContext.source_metadata ?? {},
        p_order_items: items,
        p_payment_method: input.payment_method ?? null,
        p_external_payment_reference: input.external_payment_reference ?? null,
        p_notes: input.notes ?? null,
        p_actor_profile_id: actorProfileId,
      });

      return { success: true, data: order };
    } catch (error) {
      logger.error("OrderDeliverySSOTService.createOrder", error as Error, {
        customer_profile_id: input.customer_profile_id,
        merchant_profile_id: input.merchant_profile_id,
        source_type: input.source_context?.source_type ?? "manual",
      });
      return { success: false, error: toErrorMessage(error) };
    }
  }

  static async getOrderById(
    orderId: string,
  ): Promise<OrderOperationResult<OrderRecord>> {
    try {
      const row = await this.getOrderRow(orderId);
      return { success: true, data: await this.hydrateOrderRecord(row) };
    } catch (error) {
      logger.error("OrderDeliverySSOTService.getOrderById", error as Error, {
        orderId,
      });
      return { success: false, error: toErrorMessage(error) };
    }
  }

  static async transitionLogisticsStatus(
    input: TransitionLogisticsStatusInput,
  ): Promise<OrderOperationResult<OrderRecord>> {
    try {
      const actorProfileId = this.requireActorProfileId(input.actor_profile_id);
      const order = await this.invokeOrderRpc(
        DELIVERY_RPCS.TRANSITION_LOGISTICS_STATUS,
        {
          p_order_id: input.order_id,
          p_to_status: input.to_status,
          p_actor_profile_id: actorProfileId,
          p_reason: input.reason ?? null,
          p_metadata: input.metadata ?? {},
        },
      );

      return { success: true, data: order };
    } catch (error) {
      logger.error(
        "OrderDeliverySSOTService.transitionLogisticsStatus",
        error as Error,
        { order_id: input.order_id, to_status: input.to_status },
      );
      return { success: false, error: toErrorMessage(error) };
    }
  }

  static async acceptOrder(
    orderId: string,
    actorProfileId?: string,
  ): Promise<OrderOperationResult<OrderRecord>> {
    return this.transitionLogisticsStatus({
      order_id: orderId,
      to_status: LOGISTICS_STATUS.ACCEPTED,
      actor_profile_id: this.requireActorProfileId(actorProfileId),
      reason: "Pedido aceito pela empresa",
    });
  }

  static async startPreparing(
    orderId: string,
    actorProfileId?: string,
  ): Promise<OrderOperationResult<OrderRecord>> {
    return this.transitionLogisticsStatus({
      order_id: orderId,
      to_status: LOGISTICS_STATUS.PREPARING,
      actor_profile_id: this.requireActorProfileId(actorProfileId),
      reason: "Pedido em preparo",
    });
  }

  static async markReadyForPickup(
    orderId: string,
    actorProfileId?: string,
  ): Promise<OrderOperationResult<OrderRecord>> {
    return this.transitionLogisticsStatus({
      order_id: orderId,
      to_status: LOGISTICS_STATUS.READY_FOR_PICKUP,
      actor_profile_id: this.requireActorProfileId(actorProfileId),
      reason: "Pedido pronto para retirada",
    });
  }

  static async markPickedUp(params: {
    order_id: string;
    courier_profile_id?: string;
    actor_profile_id?: string;
    reason?: string;
  }): Promise<OrderOperationResult<OrderRecord>> {
    try {
      const actorProfileId = this.requireActorProfileId(params.actor_profile_id);
      const order = await this.invokeOrderRpc(DELIVERY_RPCS.MARK_PICKED_UP, {
        p_order_id: params.order_id,
        p_actor_profile_id: actorProfileId,
        p_courier_profile_id: params.courier_profile_id ?? null,
        p_reason: params.reason ?? null,
      });

      return { success: true, data: order };
    } catch (error) {
      logger.error("OrderDeliverySSOTService.markPickedUp", error as Error, params);
      return { success: false, error: toErrorMessage(error) };
    }
  }

  static async attachDeliveryProof(
    input: AttachDeliveryProofInput,
  ): Promise<OrderOperationResult<OrderRecord>> {
    try {
      const actorProfileId = this.requireActorProfileId(input.actor_profile_id);
      const order = await this.invokeOrderRpc(DELIVERY_RPCS.ATTACH_DELIVERY_PROOF, {
        p_order_id: input.order_id,
        p_actor_profile_id: actorProfileId,
        p_proof: normalizeProofInput(input.proof),
      });

      return { success: true, data: order };
    } catch (error) {
      logger.error("OrderDeliverySSOTService.attachDeliveryProof", error as Error, {
        order_id: input.order_id,
      });
      return { success: false, error: toErrorMessage(error) };
    }
  }

  static async markDelivered(input: {
    order_id: string;
    proof?: DeliveryProof;
    actor_profile_id?: string;
    reason?: string;
  }): Promise<OrderOperationResult<OrderRecord>> {
    try {
      const actorProfileId = this.requireActorProfileId(input.actor_profile_id);
      const order = await this.invokeOrderRpc(DELIVERY_RPCS.MARK_DELIVERED, {
        p_order_id: input.order_id,
        p_actor_profile_id: actorProfileId,
        p_reason: input.reason ?? null,
        p_proof: normalizeProofInput(input.proof),
      });

      return { success: true, data: order };
    } catch (error) {
      logger.error("OrderDeliverySSOTService.markDelivered", error as Error, {
        order_id: input.order_id,
      });
      return { success: false, error: toErrorMessage(error) };
    }
  }

  static async cancelOrder(input: {
    order_id: string;
    actor_profile_id?: string;
    reason?: string;
  }): Promise<OrderOperationResult<OrderRecord>> {
    return this.transitionLogisticsStatus({
      order_id: input.order_id,
      to_status: LOGISTICS_STATUS.CANCELED,
      actor_profile_id: this.requireActorProfileId(input.actor_profile_id),
      reason: input.reason ?? "Pedido cancelado",
    });
  }

  static async failOrder(input: {
    order_id: string;
    actor_profile_id?: string;
    reason?: string;
  }): Promise<OrderOperationResult<OrderRecord>> {
    return this.transitionLogisticsStatus({
      order_id: input.order_id,
      to_status: LOGISTICS_STATUS.FAILED,
      actor_profile_id: this.requireActorProfileId(input.actor_profile_id),
      reason: input.reason ?? "Falha operacional na entrega",
    });
  }

  static async transitionFinancialStatus(
    input: TransitionFinancialStatusInput,
  ): Promise<OrderOperationResult<OrderRecord>> {
    try {
      const actorProfileId = this.requireActorProfileId(input.actor_profile_id);
      this.assertFinancialStatusSupportedNow(input.to_status);

      const order = await this.invokeOrderRpc(
        DELIVERY_RPCS.TRANSITION_FINANCIAL_STATUS,
        {
          p_order_id: input.order_id,
          p_to_status: input.to_status,
          p_actor_profile_id: actorProfileId,
          p_reason: input.reason ?? null,
          p_metadata: input.metadata ?? {},
        },
      );

      return { success: true, data: order };
    } catch (error) {
      logger.error(
        "OrderDeliverySSOTService.transitionFinancialStatus",
        error as Error,
        { order_id: input.order_id, to_status: input.to_status },
      );
      return { success: false, error: toErrorMessage(error) };
    }
  }

  static async reportDeliveryOccurrence(
    input: ReportDeliveryOccurrenceInput,
  ): Promise<OrderOperationResult<DeliveryOccurrence>> {
    try {
      const actorProfileId = this.requireActorProfileId(input.actor_profile_id);
      const occurrence = await this.invokeOccurrenceRpc(
        DELIVERY_RPCS.REPORT_OCCURRENCE,
        {
          p_order_id: input.order_id,
          p_occurrence_type: input.occurrence_type,
          p_description: input.description,
          p_actor_profile_id: actorProfileId,
          p_severity: (input.severity ?? "medium") as DeliveryOccurrenceSeverity,
          p_metadata: input.metadata ?? {},
        },
      );

      return { success: true, data: occurrence };
    } catch (error) {
      logger.error("OrderDeliverySSOTService.reportDeliveryOccurrence", error as Error, {
        order_id: input.order_id,
      });
      return { success: false, error: toErrorMessage(error) };
    }
  }

  static async resolveDeliveryOccurrence(
    input: ResolveDeliveryOccurrenceInput,
  ): Promise<OrderOperationResult<DeliveryOccurrence>> {
    try {
      const actorProfileId = this.requireActorProfileId(input.actor_profile_id);
      const occurrence = await this.invokeOccurrenceRpc(
        DELIVERY_RPCS.RESOLVE_OCCURRENCE,
        {
          p_order_id: input.order_id,
          p_occurrence_id: input.occurrence_id,
          p_actor_profile_id: actorProfileId,
          p_resolution_notes: input.resolution_notes,
        },
      );

      return { success: true, data: occurrence };
    } catch (error) {
      logger.error(
        "OrderDeliverySSOTService.resolveDeliveryOccurrence",
        error as Error,
        { occurrence_id: input.occurrence_id, order_id: input.order_id },
      );
      return { success: false, error: toErrorMessage(error) };
    }
  }

  static async listTimeline(
    orderId: string,
  ): Promise<OrderOperationResult<OrderTimelineEvent[]>> {
    try {
      const { data, error } = await (supabase as any)
        .from(ORDER_TIMELINE_TABLE)
        .select("*")
        .eq("order_id", orderId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      const timeline = (data ?? []).map((row: Record<string, unknown>) =>
        asTimelineEvent(row),
      );

      return { success: true, data: timeline };
    } catch (error) {
      logger.error("OrderDeliverySSOTService.listTimeline", error as Error, {
        orderId,
      });
      return { success: false, error: toErrorMessage(error) };
    }
  }

  static async listDeliveryOccurrences(
    orderId: string,
  ): Promise<OrderOperationResult<DeliveryOccurrence[]>> {
    try {
      const { data, error } = await (supabase as any)
        .from(DELIVERY_OCCURRENCES_TABLE)
        .select("*")
        .eq("order_id", orderId)
        .order("occurred_at", { ascending: false });

      if (error) throw error;

      const occurrences = (data ?? []).map((row: Record<string, unknown>) =>
        asOccurrence(row),
      );

      return { success: true, data: occurrences };
    } catch (error) {
      logger.error("OrderDeliverySSOTService.listDeliveryOccurrences", error as Error, {
        orderId,
      });
      return { success: false, error: toErrorMessage(error) };
    }
  }
}



