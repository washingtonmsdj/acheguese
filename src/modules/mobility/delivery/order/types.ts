/**
 * Domínio interno: order
 *
 * Entidade principal de pedido e contratos operacionais.
 */

import type { OrderActorRole, OrderTimelineEvent } from "../audit-timeline/types";
import type { DeliveryMode } from "../delivery/types";
import type { DeliveryOccurrence } from "../incidents/types";
import type { FinancialStatus, PaymentMode } from "../payment-context/types";
import type { DeliveryProof } from "../proof-of-delivery/types";
import type { LogisticsStatus } from "../logistics/types";
import type {
  OrderFinancialBreakdown,
  SettlementContext,
  SettlementPreviewInput,
} from "../settlement-context/types";

export const ORDER_SOURCE_TYPE = {
  MANUAL: "manual",
  BUSINESS: "business",
  GASTRONOMY: "gastronomy",
  SERVICE: "service",
} as const;

export type OrderSourceType =
  (typeof ORDER_SOURCE_TYPE)[keyof typeof ORDER_SOURCE_TYPE];

export interface OrderSourceContext {
  source_type: OrderSourceType;
  source_id?: string | null;
  source_reference?: string | null;
  source_metadata?: Record<string, unknown>;
}

export interface OrderItemVariantSnapshot {
  variant_id?: string | null;
  name: string;
  price_adjustment: number;
}

export interface OrderItemAddonSnapshot {
  addon_id?: string | null;
  name: string;
  unit_price: number;
  quantity: number;
  total_price: number;
}

export interface OrderItemSnapshot {
  base_unit_price?: number;
  variant?: OrderItemVariantSnapshot | null;
  addons?: OrderItemAddonSnapshot[];
  special_instructions?: string | null;
  description?: string | null;
}

export interface OrderItemRecord {
  id: string;
  order_id: string;
  source_item_id?: string | null;
  sku?: string | null;
  name: string;
  quantity: number;
  unit_price: number;
  addons_total: number;
  line_total: number;
  notes?: string | null;
  item_snapshot: OrderItemSnapshot;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CreateOrderItemInput {
  source_item_id?: string;
  sku?: string;
  name: string;
  quantity: number;
  unit_price: number;
  addons_total?: number;
  line_total?: number;
  notes?: string;
  item_snapshot?: OrderItemSnapshot;
  metadata?: Record<string, unknown>;
}

export interface OrderRecord {
  id: string;
  customer_profile_id: string;
  merchant_profile_id: string;
  courier_profile_id?: string | null;
  source_context: OrderSourceContext;
  payment_mode: PaymentMode;
  delivery_mode: DeliveryMode;
  logistics_status: LogisticsStatus;
  financial_status: FinancialStatus;
  financial_breakdown: OrderFinancialBreakdown;
  settlement_context: SettlementContext;
  items: OrderItemRecord[];
  payment_method?: string | null;
  external_payment_reference?: string | null;
  notes?: string | null;
  proof_of_delivery?: DeliveryProof | null;
  failure_reason?: string | null;
  accepted_at?: string | null;
  preparing_at?: string | null;
  ready_for_pickup_at?: string | null;
  picked_up_at?: string | null;
  delivered_at?: string | null;
  canceled_at?: string | null;
  failed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateOrderInput {
  customer_profile_id: string;
  merchant_profile_id: string;
  courier_profile_id?: string;
  source_context?: OrderSourceContext;
  payment_mode?: PaymentMode;
  delivery_mode?: DeliveryMode;
  payment_method?: string;
  external_payment_reference?: string;
  notes?: string;
  financial: SettlementPreviewInput;
  items?: CreateOrderItemInput[];
  initial_financial_status?: FinancialStatus;
  actor_profile_id: string;
}

export interface TransitionLogisticsStatusInput {
  order_id: string;
  to_status: LogisticsStatus;
  actor_profile_id: string;
  reason?: string;
  metadata?: Record<string, unknown>;
}

export interface TransitionFinancialStatusInput {
  order_id: string;
  to_status: FinancialStatus;
  actor_profile_id: string;
  reason?: string;
  metadata?: Record<string, unknown>;
}

export interface ReportDeliveryOccurrenceInput {
  order_id: string;
  occurrence_type: DeliveryOccurrence["occurrence_type"];
  severity?: DeliveryOccurrence["severity"];
  description: string;
  actor_profile_id: string;
  metadata?: Record<string, unknown>;
}

export interface ResolveDeliveryOccurrenceInput {
  occurrence_id: string;
  order_id: string;
  resolution_notes: string;
  actor_profile_id: string;
}

export interface AttachDeliveryProofInput {
  order_id: string;
  proof: DeliveryProof;
  actor_profile_id: string;
}

export interface OrderOperationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export type { OrderTimelineEvent, OrderActorRole };
