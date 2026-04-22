/**
 * Domínio interno: audit timeline
 */

import type { LogisticsStatus } from "../logistics/types";
import type { FinancialStatus } from "../payment-context/types";

export const ORDER_TIMELINE_EVENT_TYPE = {
  ORDER_CREATED: "order_created",
  ORDER_ACCEPTED: "order_accepted",
  ORDER_PREPARING: "order_preparing",
  ORDER_READY_FOR_PICKUP: "order_ready_for_pickup",
  ORDER_PICKED_UP: "order_picked_up",
  ORDER_DELIVERED: "order_delivered",
  ORDER_CANCELED: "order_canceled",
  ORDER_FAILED: "order_failed",
  FINANCIAL_STATUS_CHANGED: "financial_status_changed",
  DELIVERY_OCCURRENCE_REPORTED: "delivery_occurrence_reported",
  DELIVERY_OCCURRENCE_RESOLVED: "delivery_occurrence_resolved",
  DELIVERY_PROOF_ATTACHED: "delivery_proof_attached",
} as const;

export type OrderTimelineEventType =
  (typeof ORDER_TIMELINE_EVENT_TYPE)[keyof typeof ORDER_TIMELINE_EVENT_TYPE];

export type OrderActorRole =
  | "customer"
  | "merchant"
  | "courier"
  | "platform"
  | "system";

export interface OrderTimelineEvent {
  id: string;
  order_id: string;
  event_type: OrderTimelineEventType | string;
  from_logistics_status?: LogisticsStatus | null;
  to_logistics_status?: LogisticsStatus | null;
  from_financial_status?: FinancialStatus | null;
  to_financial_status?: FinancialStatus | null;
  actor_profile_id?: string | null;
  actor_role: OrderActorRole;
  reason?: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}
