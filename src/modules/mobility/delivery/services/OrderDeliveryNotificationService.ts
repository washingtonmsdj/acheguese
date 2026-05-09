import { supabase } from "@/integrations/supabase";
import { profileService } from "@/core/profiles/services/ProfileService";
import { logger } from "@/shared/utils/logger";
import type { OrderRecord } from "../order/types";
import { LOGISTICS_STATUS, type LogisticsStatus } from "../logistics/types";

interface NotificationPayload {
  userId: string;
  audience: "customer" | "merchant" | "courier";
  title: string;
  message: string;
  actionUrl?: string | null;
  actionLabel?: string | null;
  metadata: Record<string, unknown>;
}

type OrderNotificationEvent =
  | "order_created"
  | "order_accepted"
  | "order_preparing"
  | "order_ready_for_pickup"
  | "courier_assigned"
  | "courier_picked_up"
  | "order_delivered"
  | "order_canceled_by_customer"
  | "order_canceled_by_merchant"
  | "delivery_failed"
  | "delivery_proof_attached"
  | "order_status_changed";

const STATUS_LABELS: Record<LogisticsStatus, string> = {
  [LOGISTICS_STATUS.PENDING]: "Pedido recebido",
  [LOGISTICS_STATUS.ACCEPTED]: "Pedido aceito",
  [LOGISTICS_STATUS.PREPARING]: "Pedido em preparo",
  [LOGISTICS_STATUS.READY_FOR_PICKUP]: "Pedido pronto para retirada",
  [LOGISTICS_STATUS.PICKED_UP]: "Pedido saiu para entrega",
  [LOGISTICS_STATUS.DELIVERED]: "Pedido entregue",
  [LOGISTICS_STATUS.CANCELED]: "Pedido cancelado",
  [LOGISTICS_STATUS.FAILED]: "Falha na entrega",
};

const CUSTOMER_MESSAGES: Record<LogisticsStatus, string> = {
  [LOGISTICS_STATUS.PENDING]: "Seu pedido foi recebido pelo estabelecimento.",
  [LOGISTICS_STATUS.ACCEPTED]: "O estabelecimento aceitou seu pedido.",
  [LOGISTICS_STATUS.PREPARING]: "Seu pedido esta sendo preparado.",
  [LOGISTICS_STATUS.READY_FOR_PICKUP]: "Seu pedido esta pronto para retirada/coleta.",
  [LOGISTICS_STATUS.PICKED_UP]: "O motoboy retirou seu pedido e iniciou a entrega.",
  [LOGISTICS_STATUS.DELIVERED]: "Seu pedido foi marcado como entregue.",
  [LOGISTICS_STATUS.CANCELED]: "Seu pedido foi cancelado.",
  [LOGISTICS_STATUS.FAILED]: "Houve uma falha operacional na entrega do pedido.",
};

const MERCHANT_MESSAGES: Record<LogisticsStatus, string> = {
  [LOGISTICS_STATUS.PENDING]: "Novo pedido recebido no painel da loja.",
  [LOGISTICS_STATUS.ACCEPTED]: "Pedido aceito pela operacao.",
  [LOGISTICS_STATUS.PREPARING]: "Pedido em preparo na operacao.",
  [LOGISTICS_STATUS.READY_FOR_PICKUP]: "Pedido pronto para coleta.",
  [LOGISTICS_STATUS.PICKED_UP]: "Motoboy retirou o pedido.",
  [LOGISTICS_STATUS.DELIVERED]: "Pedido entregue ao cliente.",
  [LOGISTICS_STATUS.CANCELED]: "Pedido cancelado.",
  [LOGISTICS_STATUS.FAILED]: "Falha registrada na entrega do pedido.",
};

const COURIER_MESSAGES: Record<LogisticsStatus, string> = {
  [LOGISTICS_STATUS.PENDING]: "Pedido ainda aguarda operacao da loja.",
  [LOGISTICS_STATUS.ACCEPTED]: "Pedido aceito pela loja. Acompanhe a fila de entregas.",
  [LOGISTICS_STATUS.PREPARING]: "Pedido em preparo. Prepare-se para a coleta quando for chamado.",
  [LOGISTICS_STATUS.READY_FOR_PICKUP]: "Pedido pronto para coleta.",
  [LOGISTICS_STATUS.PICKED_UP]: "Entrega em rota. Mantenha o cliente informado.",
  [LOGISTICS_STATUS.DELIVERED]: "Entrega concluida.",
  [LOGISTICS_STATUS.CANCELED]: "Pedido cancelado. Verifique se ha acao pendente.",
  [LOGISTICS_STATUS.FAILED]: "Falha de entrega registrada. Revise o incidente no painel.",
};

const EVENT_LABELS: Record<OrderNotificationEvent, string> = {
  order_created: "Pedido criado",
  order_accepted: "Pedido aceito pela loja",
  order_preparing: "Pedido em preparo",
  order_ready_for_pickup: "Pedido pronto para coleta",
  courier_assigned: "Motoboy atribuido",
  courier_picked_up: "Pedido retirado",
  order_delivered: "Pedido entregue",
  order_canceled_by_customer: "Pedido cancelado pelo cliente",
  order_canceled_by_merchant: "Pedido cancelado pela loja",
  delivery_failed: "Falha de entrega",
  order_status_changed: "Status atualizado",
  delivery_proof_attached: "Comprovante anexado",
};

function orderShortId(orderId: string): string {
  return orderId.slice(0, 8).toUpperCase();
}

function merchantOrderUrl(order: OrderRecord): string | null {
  const businessId = order.source_context.source_id;
  if (!businessId || order.source_context.source_type !== "gastronomy") return null;
  return `/central/empresas/${businessId}/gastronomia/pedidos/${order.id}`;
}

function customerOrderUrl(order: OrderRecord): string | null {
  if (order.source_context.source_type !== "gastronomy") return null;
  return `/gastronomia/pedidos/${order.id}`;
}

function notificationMetadata(order: OrderRecord, event: OrderNotificationEvent): Record<string, unknown> {
  return {
    event,
    event_label: EVENT_LABELS[event] ?? event,
    order_id: order.id,
    order_status: order.logistics_status,
    source_type: order.source_context.source_type,
    source_id: order.source_context.source_id ?? null,
    merchant_profile_id: order.merchant_profile_id,
    customer_profile_id: order.customer_profile_id,
    courier_profile_id: order.courier_profile_id ?? null,
  };
}

function dedupeNotifications(notifications: NotificationPayload[]): NotificationPayload[] {
  const seen = new Set<string>();

  return notifications.filter((notification) => {
    const key = `${notification.userId}:${notification.audience}:${notification.metadata.event}:${notification.metadata.order_status}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export class OrderDeliveryNotificationService {
  private static async getUserIdByProfileId(profileId?: string | null): Promise<string | null> {
    if (!profileId) return null;

    try {
      const profile = await profileService.getProfileById(profileId);
      return typeof profile?.user_id === "string" ? profile.user_id : null;
    } catch (error) {
      logger.warn("OrderDeliveryNotificationService.getUserIdByProfileId", {
        profile_id: profileId,
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  private static async createNotification(payload: NotificationPayload): Promise<void> {
    const { error } = await (supabase as any).rpc("create_notification", {
      p_user_id: payload.userId,
      p_type: "order_update",
      p_category: "system",
      p_title: payload.title,
      p_message: payload.message,
      p_action_url: payload.actionUrl ?? null,
      p_action_label: payload.actionLabel ?? null,
      p_metadata: payload.metadata,
    });

    if (error) throw error;
  }

  private static resolveDefaultEvent(order: OrderRecord): OrderNotificationEvent {
    switch (order.logistics_status) {
      case LOGISTICS_STATUS.ACCEPTED:
        return "order_accepted";
      case LOGISTICS_STATUS.PREPARING:
        return "order_preparing";
      case LOGISTICS_STATUS.READY_FOR_PICKUP:
        return "order_ready_for_pickup";
      case LOGISTICS_STATUS.PICKED_UP:
        return order.courier_profile_id ? "courier_picked_up" : "courier_assigned";
      case LOGISTICS_STATUS.DELIVERED:
        return "order_delivered";
      case LOGISTICS_STATUS.CANCELED:
        return "order_canceled_by_merchant";
      case LOGISTICS_STATUS.FAILED:
        return "delivery_failed";
      default:
        return "order_status_changed";
    }
  }

  static async notifyOrderCreated(order: OrderRecord): Promise<void> {
    await this.notifyOrderStatusChanged(order, "order_created");
  }

  static async notifyOrderStatusChanged(
    order: OrderRecord,
    event?: OrderNotificationEvent,
  ): Promise<void> {
    try {
      const [customerUserId, merchantUserId, courierUserId] = await Promise.all([
        this.getUserIdByProfileId(order.customer_profile_id),
        this.getUserIdByProfileId(order.merchant_profile_id),
        this.getUserIdByProfileId(order.courier_profile_id),
      ]);

      const status = order.logistics_status;
      const resolvedEvent = event ?? this.resolveDefaultEvent(order);
      const title = `${STATUS_LABELS[status]} #${orderShortId(order.id)}`;
      const metadata = notificationMetadata(order, resolvedEvent);
      const actionUrl = merchantOrderUrl(order);
      const customerActionUrl = customerOrderUrl(order);

      const notifications: NotificationPayload[] = [];

      if (customerUserId) {
        notifications.push({
          userId: customerUserId,
          audience: "customer",
          title,
          message: `${CUSTOMER_MESSAGES[status]} (${EVENT_LABELS[resolvedEvent]}).`,
          actionUrl: customerActionUrl,
          actionLabel: customerActionUrl ? "Abrir pedido" : null,
          metadata: { ...metadata, audience: "customer" },
        });
      }

      if (merchantUserId) {
        notifications.push({
          userId: merchantUserId,
          audience: "merchant",
          title,
          message: `${MERCHANT_MESSAGES[status]} (${EVENT_LABELS[resolvedEvent]}).`,
          actionUrl,
          actionLabel: actionUrl ? "Abrir pedido" : null,
          metadata: { ...metadata, audience: "merchant" },
        });
      }

      if (courierUserId && status !== LOGISTICS_STATUS.PENDING) {
        notifications.push({
          userId: courierUserId,
          audience: "courier",
          title,
          message: `${COURIER_MESSAGES[status]} (${EVENT_LABELS[resolvedEvent]}).`,
          actionUrl: "/central/motoboy/entregas",
          actionLabel: "Abrir entregas",
          metadata: { ...metadata, audience: "courier" },
        });
      }

      await Promise.all(
        dedupeNotifications(notifications).map((notification) =>
          this.createNotification(notification),
        ),
      );
    } catch (error) {
      logger.warn("OrderDeliveryNotificationService.notifyOrderStatusChanged", {
        order_id: order.id,
        event: event ?? null,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
