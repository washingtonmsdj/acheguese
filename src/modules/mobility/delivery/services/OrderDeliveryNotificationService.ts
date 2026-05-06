import { supabase } from "@/integrations/supabase";
import { profileService } from "@/core/profiles/services/ProfileService";
import { logger } from "@/shared/utils/logger";
import type { OrderRecord } from "../order/types";
import { LOGISTICS_STATUS, type LogisticsStatus } from "../logistics/types";

interface NotificationPayload {
  userId: string;
  title: string;
  message: string;
  actionUrl?: string | null;
  actionLabel?: string | null;
  metadata: Record<string, unknown>;
}

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

function orderShortId(orderId: string): string {
  return orderId.slice(0, 8).toUpperCase();
}

function merchantOrderUrl(order: OrderRecord): string | null {
  const businessId = order.source_context.source_id;
  if (!businessId || order.source_context.source_type !== "gastronomy") return null;
  return `/central/empresas/${businessId}/gastronomia/pedidos/${order.id}`;
}

function notificationMetadata(order: OrderRecord, event: string): Record<string, unknown> {
  return {
    event,
    order_id: order.id,
    order_status: order.logistics_status,
    source_type: order.source_context.source_type,
    source_id: order.source_context.source_id ?? null,
  };
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

  static async notifyOrderCreated(order: OrderRecord): Promise<void> {
    await this.notifyOrderStatusChanged(order, "order_created");
  }

  static async notifyOrderStatusChanged(order: OrderRecord, event = "order_status_changed"): Promise<void> {
    try {
      const [customerUserId, merchantUserId, courierUserId] = await Promise.all([
        this.getUserIdByProfileId(order.customer_profile_id),
        this.getUserIdByProfileId(order.merchant_profile_id),
        this.getUserIdByProfileId(order.courier_profile_id),
      ]);

      const status = order.logistics_status;
      const title = `${STATUS_LABELS[status]} #${orderShortId(order.id)}`;
      const metadata = notificationMetadata(order, event);
      const actionUrl = merchantOrderUrl(order);

      const notifications: NotificationPayload[] = [];

      if (customerUserId) {
        notifications.push({
          userId: customerUserId,
          title,
          message: CUSTOMER_MESSAGES[status],
          actionUrl: null,
          actionLabel: null,
          metadata: { ...metadata, audience: "customer" },
        });
      }

      if (merchantUserId) {
        notifications.push({
          userId: merchantUserId,
          title,
          message: MERCHANT_MESSAGES[status],
          actionUrl,
          actionLabel: actionUrl ? "Abrir pedido" : null,
          metadata: { ...metadata, audience: "merchant" },
        });
      }

      if (courierUserId && status !== LOGISTICS_STATUS.PENDING) {
        notifications.push({
          userId: courierUserId,
          title,
          message: `Status do pedido atualizado: ${STATUS_LABELS[status]}.`,
          actionUrl: "/central/motoboy/entregas",
          actionLabel: "Abrir entregas",
          metadata: { ...metadata, audience: "courier" },
        });
      }

      await Promise.all(notifications.map((notification) => this.createNotification(notification)));
    } catch (error) {
      logger.warn("OrderDeliveryNotificationService.notifyOrderStatusChanged", {
        order_id: order.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
