import type { OrderSourceType } from "./types";

export interface DeliveryPricingSnapshot {
  items_subtotal: number;
  fee_charged_to_customer: number;
  order_total: number;
  courier_cost: number | null;
  margin: number | null;
  currency: "BRL";
  finalized_at?: string;
}

export interface DeliveryOrderSourceMetadata {
  business_name?: string | null;
  cuisine_type?: string | null;
  delivery_enabled?: boolean | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  customer_email?: string | null;
  delivery_address_id?: string | null;
  delivery_lat?: number | null;
  delivery_lng?: number | null;
  delivery_address?: string | null;
  delivery_street?: string | null;
  delivery_number?: string | null;
  delivery_postal_code?: string | null;
  delivery_zipcode?: string | null;
  delivery_complement?: string | null;
  delivery_reference?: string | null;
  delivery_neighborhood?: string | null;
  delivery_city?: string | null;
  delivery_state?: string | null;
  delivery_items_subtotal?: number | null;
  delivery_fee_customer?: number | null;
  delivery_order_total?: number | null;
  delivery_pricing?: DeliveryPricingSnapshot | null;
}

const DELIVERY_SOURCE_TYPES = new Set<OrderSourceType>([
  "gastronomy",
  "business",
  "service",
]);

export interface BuildDeliveryPricingInput {
  itemsSubtotal: number;
  feeChargedToCustomer: number;
  orderTotal: number;
  courierCost?: number | null;
  margin?: number | null;
  finalizedAt?: string;
}

export function buildDeliveryPricingSnapshot(
  input: BuildDeliveryPricingInput,
): DeliveryPricingSnapshot {
  return {
    items_subtotal: Number(input.itemsSubtotal.toFixed(2)),
    fee_charged_to_customer: Number(input.feeChargedToCustomer.toFixed(2)),
    order_total: Number(input.orderTotal.toFixed(2)),
    courier_cost:
      typeof input.courierCost === "number" && Number.isFinite(input.courierCost)
        ? Number(input.courierCost.toFixed(2))
        : null,
    margin:
      typeof input.margin === "number" && Number.isFinite(input.margin)
        ? Number(input.margin.toFixed(2))
        : null,
    currency: "BRL",
    ...(input.finalizedAt ? { finalized_at: input.finalizedAt } : {}),
  };
}

export function asDeliveryOrderSourceMetadata(
  sourceType: OrderSourceType,
  metadata: Record<string, unknown> | undefined | null,
): DeliveryOrderSourceMetadata {
  if (!DELIVERY_SOURCE_TYPES.has(sourceType) || !metadata) return {};
  return metadata as unknown as DeliveryOrderSourceMetadata;
}
