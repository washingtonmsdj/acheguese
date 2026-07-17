/**
 * OrderService - facade de pedidos da gastronomia.
 *
 * O SSOT real de pedidos/entregas e OrderDeliverySSOTService. Este facade mantem
 * o contrato historico das telas de gastronomia enquanto converte leitura e
 * operações para orders/order_items/order_timeline_events canônicos.
 */

import { logger } from '@/shared/utils/logger';
import { getRecordValue } from '@/shared/utils/recordLookup';
import { OrderDeliverySSOTService } from '@/core/mobility/delivery/services/OrderDeliverySSOTService';
import { MobilityService } from '@/core/mobility/services/runtime';
import {
  asDeliveryOrderSourceMetadata,
  buildDeliveryPricingSnapshot,
} from '@/core/mobility/delivery/order/sourceMetadata';
import { LOGISTICS_STATUS, type LogisticsStatus } from '@/core/mobility/delivery/logistics/types';
import { FINANCIAL_STATUS } from '@/core/mobility/delivery/payment-context/types';
import { ORDER_SOURCE_TYPE, type OrderItemRecord, type OrderRecord } from '@/core/mobility/delivery/order/types';
import type { OrderTimelineEvent } from '@/core/mobility/delivery/audit-timeline/types';
import type { DeliveryProof } from '@/core/mobility/delivery/proof-of-delivery/types';

export interface ServiceResult<T> {
  data: T | null;
  error: string | null;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'out_for_delivery'
  | 'delivered'
  | 'completed'
  | 'cancelled';

export type OrderType = 'pickup' | 'delivery' | 'dine_in';
export type PaymentMethod =
  | 'cash'
  | 'debit_card'
  | 'credit_card'
  | 'pix'
  | 'online'
  | 'card_on_delivery'
  | 'payment_link';

export interface Order {
  id: string;
  business_id: string;
  merchant_profile_id: string;
  customer_id: string | null;
  courier_profile_id: string | null;
  delivery_area_id: string | null;
  order_number: string;
  order_type: OrderType;
  status: OrderStatus;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  delivery_address: string | null;
  delivery_neighborhood: string | null;
  delivery_city: string | null;
  delivery_state: string | null;
  delivery_zipcode: string | null;
  delivery_complement: string | null;
  delivery_reference: string | null;
  delivery_items_subtotal: number | null;
  delivery_fee_customer: number | null;
  delivery_order_total: number | null;
  delivery_courier_cost: number | null;
  delivery_margin: number | null;
  subtotal: number;
  delivery_fee: number;
  discount: number;
  total: number;
  payment_method: PaymentMethod | null;
  payment_status: string;
  change_for: number | null;
  notes: string | null;
  internal_notes: string | null;
  estimated_preparation_time: number | null;
  estimated_delivery_time: number | null;
  scheduled_for: string | null;
  confirmed_at: string | null;
  preparing_at: string | null;
  ready_at: string | null;
  out_for_delivery_at: string | null;
  delivered_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  proof_of_delivery: DeliveryProof | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string | null;
  item_name: string;
  name: string;
  item_description: string | null;
  item_image_url: string | null;
  variation_id: string | null;
  variation_name: string | null;
  quantity: number;
  unit_price: number;
  subtotal: number;
  total: number;
  notes: string | null;
  created_at: string;
}

export interface OrderItemAddon {
  id: string;
  order_item_id: string;
  addon_id: string | null;
  addon_name: string;
  addon_price: number;
  quantity: number;
  created_at: string;
}

export interface OrderStatusHistory {
  id: string;
  order_id: string;
  event_type: string;
  from_status: OrderStatus | null;
  to_status: OrderStatus | null;
  from_financial_status: string | null;
  to_financial_status: string | null;
  changed_by: string | null;
  notes: string | null;
  created_at: string;
}

export interface OrderWithItems extends Order {
  items: (OrderItem & { addons: OrderItemAddon[] })[];
  status_history: OrderStatusHistory[];
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Erro inesperado no modulo de pedidos de gastronomia.';
}

function logisticsToOrderStatus(status: LogisticsStatus): OrderStatus {
  switch (status) {
    case LOGISTICS_STATUS.ACCEPTED:
      return 'confirmed';
    case LOGISTICS_STATUS.PREPARING:
      return 'preparing';
    case LOGISTICS_STATUS.READY_FOR_PICKUP:
      return 'ready';
    case LOGISTICS_STATUS.PICKED_UP:
      return 'out_for_delivery';
    case LOGISTICS_STATUS.DELIVERED:
      return 'delivered';
    case LOGISTICS_STATUS.CANCELED:
    case LOGISTICS_STATUS.FAILED:
      return 'cancelled';
    case LOGISTICS_STATUS.PENDING:
    default:
      return 'pending';
  }
}

function orderStatusToLogistics(status: OrderStatus): LogisticsStatus {
  switch (status) {
    case 'confirmed':
      return LOGISTICS_STATUS.ACCEPTED;
    case 'preparing':
      return LOGISTICS_STATUS.PREPARING;
    case 'ready':
      return LOGISTICS_STATUS.READY_FOR_PICKUP;
    case 'out_for_delivery':
      return LOGISTICS_STATUS.PICKED_UP;
    case 'delivered':
    case 'completed':
      return LOGISTICS_STATUS.DELIVERED;
    case 'cancelled':
      return LOGISTICS_STATUS.CANCELED;
    case 'pending':
    default:
      return LOGISTICS_STATUS.PENDING;
  }
}

function orderDisplayNumber(orderId: string): string {
  return orderId.slice(0, 8).toUpperCase();
}

function getMetadataString(order: OrderRecord, key: string): string | null {
  const metadata = order.source_context.source_metadata;
  const value = metadata ? getRecordValue(metadata, key) : undefined;
  return typeof value === 'string' && value.trim() ? value : null;
}

function getOrderType(order: OrderRecord): OrderType {
  const rawType = getMetadataStringFirst(order, ['fulfillment_mode', 'order_type']);
  if (rawType === 'takeout' || rawType === 'pickup') return 'pickup';
  if (rawType === 'dine_in') return 'dine_in';
  return 'delivery';
}

function getMetadataStringFirst(order: OrderRecord, keys: readonly string[]): string | null {
  for (const key of keys) {
    const value = getMetadataString(order, key);
    if (value) {
      return value;
    }
  }
  return null;
}

function getMetadataNumber(order: OrderRecord, key: string): number | null {
  const metadata = order.source_context.source_metadata;
  const value = metadata ? getRecordValue(metadata, key) : undefined;
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function getDeliveryPricingNumber(
  order: OrderRecord,
  key: 'courier_cost' | 'margin',
): number | null {
  const metadata = asDeliveryOrderSourceMetadata(
    order.source_context.source_type,
    order.source_context.source_metadata,
  );
  const pricing = metadata.delivery_pricing;
  if (!pricing) return null;
  const value = key === 'courier_cost' ? pricing.courier_cost : pricing.margin;
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function mapOrderItem(item: OrderItemRecord): OrderItem & { addons: OrderItemAddon[] } {
  return {
    id: item.id,
    order_id: item.order_id,
    menu_item_id: item.source_item_id ?? null,
    item_name: item.name,
    name: item.name,
    item_description: item.item_snapshot.description ?? null,
    item_image_url: null,
    variation_id: item.item_snapshot.variant?.variant_id ?? null,
    variation_name: item.item_snapshot.variant?.name ?? null,
    quantity: item.quantity,
    unit_price: item.unit_price,
    subtotal: item.line_total,
    total: item.line_total,
    notes: item.notes ?? item.item_snapshot.special_instructions ?? null,
    created_at: item.created_at,
    addons: (item.item_snapshot.addons ?? []).map((addon, index) => ({
      id: `${item.id}:addon:${index}`,
      order_item_id: item.id,
      addon_id: addon.addon_id ?? null,
      addon_name: addon.name,
      addon_price: addon.unit_price,
      quantity: addon.quantity,
      created_at: item.created_at,
    })),
  };
}

function mapTimelineEvent(event: OrderTimelineEvent): OrderStatusHistory {
  return {
    id: event.id,
    order_id: event.order_id,
    event_type: event.event_type,
    from_status: event.from_logistics_status
      ? logisticsToOrderStatus(event.from_logistics_status)
      : null,
    to_status: event.to_logistics_status
      ? logisticsToOrderStatus(event.to_logistics_status)
      : null,
    from_financial_status: event.from_financial_status ?? null,
    to_financial_status: event.to_financial_status ?? null,
    changed_by: event.actor_profile_id,
    notes: event.reason,
    created_at: event.created_at,
  };
}

function mapOrder(order: OrderRecord): OrderWithItems {
  const businessId = order.source_context.source_id ?? order.merchant_profile_id;
  const status = logisticsToOrderStatus(order.logistics_status);
  const orderType = getOrderType(order);

  return {
    id: order.id,
    business_id: businessId,
    merchant_profile_id: order.merchant_profile_id,
    customer_id: order.customer_profile_id,
    courier_profile_id: order.courier_profile_id ?? null,
    delivery_area_id: null,
    order_number: orderDisplayNumber(order.id),
    order_type: orderType,
    status,
    customer_name: getMetadataString(order, 'customer_name') ?? `Cliente ${order.customer_profile_id.slice(0, 8)}`,
    customer_phone: getMetadataString(order, 'customer_phone') ?? '',
    customer_email: getMetadataString(order, 'customer_email'),
    delivery_address: getMetadataStringFirst(order, ['delivery_address', 'delivery_street']),
    delivery_neighborhood: getMetadataString(order, 'delivery_neighborhood'),
    delivery_city: getMetadataString(order, 'delivery_city'),
    delivery_state: getMetadataString(order, 'delivery_state'),
    delivery_zipcode: getMetadataStringFirst(order, ['delivery_zipcode', 'delivery_postal_code']),
    delivery_complement: getMetadataString(order, 'delivery_complement'),
    delivery_reference: getMetadataString(order, 'delivery_reference'),
    delivery_items_subtotal: getMetadataNumber(order, 'delivery_items_subtotal'),
    delivery_fee_customer: getMetadataNumber(order, 'delivery_fee_customer'),
    delivery_order_total: getMetadataNumber(order, 'delivery_order_total'),
    delivery_courier_cost: getDeliveryPricingNumber(order, 'courier_cost'),
    delivery_margin: getDeliveryPricingNumber(order, 'margin'),
    subtotal: order.financial_breakdown.items_total,
    delivery_fee: order.financial_breakdown.delivery_fee,
    discount: order.financial_breakdown.discount_total,
    total: order.financial_breakdown.order_total,
    payment_method: (order.payment_method as PaymentMethod | null) ?? null,
    payment_status: order.financial_status,
    change_for: null,
    notes: order.notes,
    internal_notes: null,
    estimated_preparation_time: null,
    estimated_delivery_time: null,
    scheduled_for: null,
    confirmed_at: order.accepted_at ?? null,
    preparing_at: order.preparing_at ?? null,
    ready_at: order.ready_for_pickup_at ?? null,
    out_for_delivery_at: order.picked_up_at ?? null,
    delivered_at: order.delivered_at ?? null,
    completed_at: status === 'completed' ? order.delivered_at ?? null : null,
    cancelled_at: order.canceled_at ?? order.failed_at ?? null,
    cancellation_reason: order.failure_reason ?? null,
    proof_of_delivery: order.proof_of_delivery ?? null,
    created_at: order.created_at,
    updated_at: order.updated_at,
    items: order.items.map(mapOrderItem),
    status_history: [],
  };
}

async function enrichDeliveryFinancials<T extends Order>(orders: T[]): Promise<T[]> {
  const enriched = await Promise.all(
    orders.map(async (order) => {
      if (order.order_type !== 'delivery') {
        return {
          ...order,
          delivery_courier_cost: null,
          delivery_margin: null,
        };
      }

      const ride = (await MobilityService.getLatestRideBySource(
        'gastronomy',
        order.id,
      )) as { final_price?: unknown; suggested_price?: unknown } | null;

      const finalPrice =
        ride && typeof ride.final_price === 'number' && Number.isFinite(ride.final_price)
          ? ride.final_price
          : null;
      const suggestedPrice =
        ride && typeof ride.suggested_price === 'number' && Number.isFinite(ride.suggested_price)
          ? ride.suggested_price
          : null;
      const courierCost = order.delivery_courier_cost ?? finalPrice ?? suggestedPrice;

      const feeCustomer = order.delivery_fee_customer ?? order.delivery_fee;
      const margin =
        courierCost !== null && Number.isFinite(feeCustomer) ? feeCustomer - courierCost : order.delivery_margin;
      const pricingSnapshot = buildDeliveryPricingSnapshot({
        itemsSubtotal: order.delivery_items_subtotal ?? order.subtotal,
        feeChargedToCustomer: feeCustomer,
        orderTotal: order.delivery_order_total ?? order.total,
        courierCost,
        margin,
      });

      return {
        ...order,
        delivery_courier_cost: courierCost,
        delivery_margin: pricingSnapshot.margin,
      };
    }),
  );

  return enriched;
}

export const OrderService = {
  async listOrders(
    businessId: string,
    filters?: {
      status?: OrderStatus;
      order_type?: OrderType;
      date_from?: string;
      date_to?: string;
      limit?: number;
    },
  ): Promise<ServiceResult<Order[]>> {
    try {
      const result = await OrderDeliverySSOTService.listOrdersBySource(
        ORDER_SOURCE_TYPE.GASTRONOMY,
        businessId,
        {
          logistics_status: filters?.status
            ? orderStatusToLogistics(filters.status)
            : undefined,
          date_from: filters?.date_from,
          date_to: filters?.date_to,
          limit: filters?.limit,
        },
      );

      if (!result.success) {
        return { data: null, error: result.error ?? 'Erro ao listar pedidos.' };
      }

      const orders = (result.data ?? [])
        .map(mapOrder)
        .filter((order) => !filters?.order_type || order.order_type === filters.order_type);

      const ordersWithFinancials = await enrichDeliveryFinancials(orders);
      return { data: ordersWithFinancials, error: null };
    } catch (error) {
      const message = toErrorMessage(error);
      logger.error('[OrderService] listOrders error', error as Error, { businessId });
      return { data: null, error: message };
    }
  },

  async getOrder(orderId: string): Promise<ServiceResult<OrderWithItems>> {
    try {
      const result = await OrderDeliverySSOTService.getOrderById(orderId);
      if (!result.success || !result.data) {
        return { data: null, error: result.error ?? 'Pedido não encontrado.' };
      }

      const order = mapOrder(result.data);
      const [orderWithFinancials] = await enrichDeliveryFinancials([order]);
      const timeline = await OrderDeliverySSOTService.listTimeline(orderId);
      order.status_history = timeline.success
        ? (timeline.data ?? []).map(mapTimelineEvent)
        : [];

      return { data: orderWithFinancials, error: null };
    } catch (error) {
      const message = toErrorMessage(error);
      logger.error('[OrderService] getOrder error', error as Error, { orderId });
      return { data: null, error: message };
    }
  },

  async createOrder(): Promise<ServiceResult<OrderWithItems>> {
    return {
      data: null,
      error: 'Criação de pedido de gastronomia deve usar GastronomyCheckoutService/OrderDeliverySSOTService.',
    };
  },

  async updateOrderStatus(
    orderId: string,
    status: OrderStatus,
    notes?: string,
    actorProfileId?: string,
  ): Promise<ServiceResult<Order>> {
    try {
      if (!actorProfileId) {
        return { data: null, error: 'Perfil ativo obrigatório para atualizar pedido.' };
      }

      const current = await OrderDeliverySSOTService.getOrderById(orderId);
      if (!current.success || !current.data) {
        return { data: null, error: current.error ?? 'Pedido não encontrado.' };
      }

      const target = orderStatusToLogistics(status);
      if (current.data.logistics_status === target) {
        return { data: mapOrder(current.data), error: null };
      }

      const result = status === 'cancelled'
        ? await OrderDeliverySSOTService.cancelOrder({
            order_id: orderId,
            reason: notes,
            actor_profile_id: actorProfileId,
          })
        : status === 'delivered' || status === 'completed'
          ? await OrderDeliverySSOTService.markDelivered({
              order_id: orderId,
              reason: notes,
              actor_profile_id: actorProfileId,
            })
          : status === 'out_for_delivery'
            ? await OrderDeliverySSOTService.markPickedUp({
                order_id: orderId,
                actor_profile_id: actorProfileId,
              })
            : await OrderDeliverySSOTService.transitionLogisticsStatus({
                order_id: orderId,
                to_status: target,
                reason: notes,
                actor_profile_id: actorProfileId,
              });

      if (!result.success || !result.data) {
        return { data: null, error: result.error ?? 'Erro ao atualizar status.' };
      }

      return { data: mapOrder(result.data), error: null };
    } catch (error) {
      const message = toErrorMessage(error);
      logger.error('[OrderService] updateOrderStatus error', error as Error, { orderId, status });
      return { data: null, error: message };
    }
  },

  async cancelOrder(
    orderId: string,
    reason: string,
    actorProfileId?: string,
    options?: {
      reasonCode?: string;
    },
  ): Promise<ServiceResult<Order>> {
    if (!actorProfileId) {
      return { data: null, error: 'Perfil ativo obrigatório para cancelar pedido.' };
    }

    const result = await OrderDeliverySSOTService.cancelOrder({
      order_id: orderId,
      reason,
      actor_profile_id: actorProfileId,
      reason_code: options?.reasonCode,
    });

    if (!result.success || !result.data) {
      return { data: null, error: result.error ?? 'Erro ao cancelar pedido.' };
    }

    return { data: mapOrder(result.data), error: null };
  },

  async updateInternalNotes(
    orderId: string,
    notes: string,
    actorProfileId?: string,
  ): Promise<ServiceResult<Order>> {
    try {
      if (!actorProfileId) {
        return { data: null, error: 'Perfil ativo obrigatório para atualizar notas internas.' };
      }

      const normalizedNotes = notes.trim();
      if (!normalizedNotes) {
        return { data: null, error: 'Informe uma nota válida para atualizar o pedido.' };
      }

      const result = await OrderDeliverySSOTService.updateOrderNotes({
        order_id: orderId,
        notes: normalizedNotes,
        actor_profile_id: actorProfileId,
        metadata: {
          source: 'gastronomy_order_operations',
          action: 'update_internal_notes',
        },
      });

      if (!result.success || !result.data) {
        return { data: null, error: result.error ?? 'Erro ao atualizar notas internas.' };
      }

      return { data: mapOrder(result.data), error: null };
    } catch (error) {
      const message = toErrorMessage(error);
      logger.error('[OrderService] updateInternalNotes error', error as Error, { orderId });
      return { data: null, error: message };
    }
  },

  async confirmOrderPayment(
    orderId: string,
    actorProfileId?: string,
    notes?: string,
  ): Promise<ServiceResult<Order>> {
    try {
      if (!actorProfileId) {
        return { data: null, error: 'Perfil ativo obrigatório para confirmar pagamento.' };
      }

      const current = await this.getOrder(orderId);
      if (current.error || !current.data) {
        return { data: null, error: current.error ?? 'Pedido não encontrado.' };
      }

      const currentOrder = current.data;
      if (!['pix', 'payment_link'].includes(currentOrder.payment_method ?? '')) {
        return {
          data: null,
          error: 'Confirmação manual disponível apenas para PIX ou link de pagamento.',
        };
      }

      if (currentOrder.payment_status === FINANCIAL_STATUS.PAID) {
        return { data: currentOrder, error: null };
      }

      const allowedPendingStatuses = new Set<string>([
        FINANCIAL_STATUS.PENDING_PAYMENT,
        FINANCIAL_STATUS.NOT_APPLICABLE,
      ]);
      if (!allowedPendingStatuses.has(String(currentOrder.payment_status))) {
        return {
          data: null,
          error: `Status financeiro atual (${currentOrder.payment_status}) não permite confirmação manual.`,
        };
      }

      const safeReason = (notes ?? 'Pagamento confirmado pela loja').trim().slice(0, 240);
      const result = await OrderDeliverySSOTService.transitionFinancialStatus({
        order_id: orderId,
        to_status: FINANCIAL_STATUS.PAID,
        actor_profile_id: actorProfileId,
        reason: safeReason,
        metadata: {
          source: 'gastronomy_order_operations',
          action: 'confirm_payment',
          from_status: currentOrder.payment_status,
        },
      });

      if (!result.success || !result.data) {
        return { data: null, error: result.error ?? 'Erro ao confirmar pagamento.' };
      }

      return { data: mapOrder(result.data), error: null };
    } catch (error) {
      const message = toErrorMessage(error);
      logger.error('[OrderService] confirmOrderPayment error', error as Error, { orderId });
      return { data: null, error: message };
    }
  },

  async getOrderStats(
    businessId: string,
    dateFrom?: string,
    dateTo?: string,
  ): Promise<ServiceResult<{
    total_orders: number;
    pending_orders: number;
    completed_orders: number;
    cancelled_orders: number;
    total_revenue: number;
    average_order_value: number;
  }>> {
    const result = await this.listOrders(businessId, {
      date_from: dateFrom,
      date_to: dateTo,
    });

    if (result.error || !result.data) {
      return { data: null, error: result.error ?? 'Erro ao buscar estatisticas.' };
    }

    const orders = result.data;
    const completed = orders.filter((order) =>
      order.status === 'delivered' || order.status === 'completed',
    );
    const totalRevenue = completed.reduce((sum, order) => sum + order.total, 0);

    return {
      data: {
        total_orders: orders.length,
        pending_orders: orders.filter((order) => order.status === 'pending').length,
        completed_orders: completed.length,
        cancelled_orders: orders.filter((order) => order.status === 'cancelled').length,
        total_revenue: totalRevenue,
        average_order_value: orders.length > 0
          ? orders.reduce((sum, order) => sum + order.total, 0) / orders.length
          : 0,
      },
      error: null,
    };
  },
};
