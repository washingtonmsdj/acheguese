import { DELIVERY_MODE } from "../../delivery/types";
import { PAYMENT_MODE } from "../../payment-context/types";
import { OrderDraftService } from "../OrderDraftService";
import { roundMoney } from "../money";
import { buildDeliveryPricingSnapshot } from "../sourceMetadata";
import {
  ORDER_SOURCE_TYPE,
  type CreateOrderInput,
  type CreateOrderItemInput,
  type OrderSourceType,
} from "../types";

interface BaseBusinessServiceItemInput {
  source_item_id?: string;
  sku?: string;
  name: string;
  quantity: number;
  unit_price: number;
  addons_total?: number;
  line_total?: number;
  notes?: string;
  metadata?: Record<string, unknown>;
}

interface BaseBusinessServiceOrderDraftInput {
  customer_profile_id: string;
  actor_profile_id: string;
  merchant_profile_id: string;
  source_id: string;
  source_reference: string;
  payment_method?: string;
  external_payment_reference?: string;
  notes?: string;
  items: BaseBusinessServiceItemInput[];
  financial: {
    delivery_fee?: number;
    discount_total?: number;
  };
  customer_snapshot?: {
    full_name?: string | null;
    phone?: string | null;
    email?: string | null;
  };
  delivery_snapshot?: {
    address_id?: string | null;
    lat?: number | null;
    lng?: number | null;
    recipient_name?: string | null;
    phone?: string | null;
    postal_code?: string | null;
    street?: string | null;
    number?: string | null;
    complement?: string | null;
    reference?: string | null;
    neighborhood?: string | null;
    city?: string | null;
    state?: string | null;
  };
}

export type CreateBusinessOrderDraftInput = BaseBusinessServiceOrderDraftInput;
export type CreateServiceOrderDraftInput = BaseBusinessServiceOrderDraftInput;

function mapItems(items: BaseBusinessServiceItemInput[]): CreateOrderItemInput[] {
  if (!items.length) {
    throw new Error("Pedido exige pelo menos um item.");
  }

  return items.map((item, index) => {
    const quantity = roundMoney(item.quantity, `item[${index}].quantity`);
    const unitPrice = roundMoney(item.unit_price, `item[${index}].unit_price`);
    const addonsTotal = roundMoney(item.addons_total ?? 0, `item[${index}].addons_total`);
    const computedLineTotal = roundMoney(quantity * unitPrice + addonsTotal, `item[${index}].computed_line_total`);
    const lineTotal = roundMoney(item.line_total ?? computedLineTotal, `item[${index}].line_total`);

    if (lineTotal !== computedLineTotal) {
      throw new Error(`Item "${item.name}" possui line_total divergente do calculo esperado.`);
    }

    return {
      source_item_id: item.source_item_id,
      sku: item.sku,
      name: item.name,
      quantity,
      unit_price: unitPrice,
      addons_total: addonsTotal,
      line_total: lineTotal,
      notes: item.notes,
      metadata: item.metadata ?? {},
      item_snapshot: {
        base_unit_price: unitPrice,
        addons: [],
        special_instructions: item.notes ?? null,
      },
    };
  });
}

function buildFormattedDeliveryAddress(input: BaseBusinessServiceOrderDraftInput): string | null {
  return [
    input.delivery_snapshot?.street,
    input.delivery_snapshot?.number,
    input.delivery_snapshot?.complement,
    input.delivery_snapshot?.neighborhood,
    input.delivery_snapshot?.city,
    input.delivery_snapshot?.state,
    input.delivery_snapshot?.postal_code ? `CEP ${input.delivery_snapshot.postal_code}` : null,
  ]
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .join(", ") || null;
}

function toCreateOrderInput(
  sourceType: OrderSourceType,
  input: BaseBusinessServiceOrderDraftInput,
): CreateOrderInput {
  if (!input.source_id.trim()) {
    throw new Error("source_id e obrigatorio para pedidos com origem business/service.");
  }
  if (!input.source_reference.trim()) {
    throw new Error("source_reference e obrigatorio para pedidos com origem business/service.");
  }

  const normalizedItems = OrderDraftService.normalizeItems(mapItems(input.items));
  const itemsTotal = roundMoney(
    normalizedItems.reduce((sum, item) => sum + item.line_total, 0),
    "items_total",
  );
  const deliveryFee = roundMoney(input.financial.delivery_fee ?? 0, "delivery_fee");
  const discountTotal = roundMoney(input.financial.discount_total ?? 0, "discount_total");
  const orderTotal = roundMoney(itemsTotal + deliveryFee - discountTotal, "order_total");
  if (orderTotal < 0) {
    throw new Error("order_total nao pode ser negativo.");
  }

  const formattedDeliveryAddress = buildFormattedDeliveryAddress(input);

  return {
    customer_profile_id: input.customer_profile_id,
    merchant_profile_id: input.merchant_profile_id,
    source_context: {
      source_type: sourceType,
      source_id: input.source_id,
      source_reference: input.source_reference,
      source_metadata: {
        customer_name: input.delivery_snapshot?.recipient_name ?? input.customer_snapshot?.full_name ?? null,
        customer_phone: input.delivery_snapshot?.phone ?? input.customer_snapshot?.phone ?? null,
        customer_email: input.customer_snapshot?.email ?? null,
        delivery_address_id: input.delivery_snapshot?.address_id ?? null,
        delivery_lat: input.delivery_snapshot?.lat ?? null,
        delivery_lng: input.delivery_snapshot?.lng ?? null,
        delivery_address: formattedDeliveryAddress,
        delivery_street: input.delivery_snapshot?.street ?? null,
        delivery_number: input.delivery_snapshot?.number ?? null,
        delivery_postal_code: input.delivery_snapshot?.postal_code ?? null,
        delivery_zipcode: input.delivery_snapshot?.postal_code ?? null,
        delivery_complement: input.delivery_snapshot?.complement ?? null,
        delivery_reference: input.delivery_snapshot?.reference ?? null,
        delivery_neighborhood: input.delivery_snapshot?.neighborhood ?? null,
        delivery_city: input.delivery_snapshot?.city ?? null,
        delivery_state: input.delivery_snapshot?.state ?? null,
        delivery_items_subtotal: itemsTotal,
        delivery_fee_customer: deliveryFee,
        delivery_order_total: orderTotal,
        delivery_pricing: buildDeliveryPricingSnapshot({
          itemsSubtotal: itemsTotal,
          feeChargedToCustomer: deliveryFee,
          orderTotal,
          courierCost: null,
          margin: null,
        }),
      },
    },
    payment_mode: PAYMENT_MODE.DIRECT_TO_MERCHANT,
    delivery_mode: DELIVERY_MODE.MERCHANT_OWN_FLEET,
    payment_method: input.payment_method,
    external_payment_reference: input.external_payment_reference,
    notes: input.notes,
    financial: {
      items_total: itemsTotal,
      delivery_fee: deliveryFee,
      discount_total: discountTotal,
    },
    items: normalizedItems,
    actor_profile_id: input.actor_profile_id,
  };
}

export class BusinessOrderOriginAdapter {
  static toCreateOrderInput(input: CreateBusinessOrderDraftInput): CreateOrderInput {
    return toCreateOrderInput(ORDER_SOURCE_TYPE.BUSINESS, input);
  }
}

export class ServiceOrderOriginAdapter {
  static toCreateOrderInput(input: CreateServiceOrderDraftInput): CreateOrderInput {
    return toCreateOrderInput(ORDER_SOURCE_TYPE.SERVICE, input);
  }
}
