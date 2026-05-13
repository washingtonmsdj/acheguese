/**
 * OrderDeliveryLinkService — Vincula orders (SSOT) com ride_requests (rastreamento GPS)
 * 
 * RESPONSABILIDADE:
 * - Criar ride_request quando order é criado com delivery
 * - Manter sincronização entre order.logistics_status e ride_request.status
 * - Fornecer queries para buscar ride_request de um order
 * 
 * SSOT:
 * - orders table: fonte de verdade do pedido
 * - ride_requests table: fonte de verdade do rastreamento GPS
 * - Vínculo: ride_requests.source_type = 'gastronomy' + source_id = order.id
 */

import { logger } from "@/shared/utils/logger";
import type { RideRequest } from "@/modules/mobility/types/types";
import { MobilityService } from "@/modules/mobility/services/MobilityService.impl";
import { OrderDeliverySSOTService } from "./OrderDeliverySSOTService";
import { LOGISTICS_STATUS, type LogisticsStatus } from "../logistics/types";
import type { DeliveryProof } from "../proof-of-delivery/types";
import {
  asDeliveryOrderSourceMetadata,
  buildDeliveryPricingSnapshot,
} from "../order/sourceMetadata";

export interface OrderDeliveryLink {
  order_id: string;
  ride_request_id: string;
  created_at: string;
}

interface LinkedRideRecord {
  id: string;
  status?: string | null;
  ride_mode?: string | null;
  source_type?: string | null;
  source_id?: string | null;
  passenger_profile_id?: string | null;
  driver_profile_id?: string | null;
  proof_of_delivery?: DeliveryProof | null;
  final_price?: number | null;
  suggested_price?: number | null;
}

const FORWARD_LOGISTICS_PATH: LogisticsStatus[] = [
  LOGISTICS_STATUS.PENDING,
  LOGISTICS_STATUS.ACCEPTED,
  LOGISTICS_STATUS.PREPARING,
  LOGISTICS_STATUS.READY_FOR_PICKUP,
  LOGISTICS_STATUS.PICKED_UP,
  LOGISTICS_STATUS.DELIVERED,
];

export class OrderDeliveryLinkService {
  /**
   * Busca ride_request vinculado a um order
   */
  static async getRideRequestByOrderId(orderId: string): Promise<RideRequest | null> {
    try {
      const ride = await MobilityService.getLatestRideBySource('gastronomy', orderId);
      return (ride as RideRequest | null) ?? null;
    } catch (error) {
      logger.error('[OrderDeliveryLinkService] Erro ao buscar ride_request', error as Error, {
        order_id: orderId,
      });
      return null;
    }
  }

  /**
   * Busca order vinculado a um ride_request
   */
  static async getOrderByRideRequestId(rideRequestId: string): Promise<string | null> {
    try {
      return await MobilityService.getRideSourceIdById(rideRequestId, 'gastronomy');
    } catch (error) {
      logger.error('[OrderDeliveryLinkService] Erro ao buscar order', error as Error, {
        ride_request_id: rideRequestId,
      });
      return null;
    }
  }

  /**
   * Verifica se order tem ride_request ativo
   */
  static async hasActiveDelivery(orderId: string): Promise<boolean> {
    const rideRequest = await this.getRideRequestByOrderId(orderId);
    
    if (!rideRequest) return false;

    const activeStatuses = [
      'requested',
      'searching_driver',
      'driver_assigned',
      'driver_accepted',
      'driver_arriving',
      'pickup_confirmed',
      'in_delivery',
    ];

    return activeStatuses.includes(rideRequest.status);
  }

  /**
   * Mapeia status de ride_request para logistics_status de order
   * 
   * Usado para sincronizar estados entre os dois sistemas
   */
  static mapRideStatusToLogisticsStatus(rideStatus: string): LogisticsStatus | null {
    const mapping: Partial<Record<string, LogisticsStatus>> = {
      'requested': 'pending',
      'searching_driver': 'pending',
      'driver_assigned': 'accepted',
      'driver_accepted': 'accepted',
      'driver_arriving': 'preparing',
      'driver_on_the_way': 'preparing',
      'driver_arrived': 'ready_for_pickup',
      'pickup_confirmed': 'picked_up',
      'in_delivery': 'picked_up',
      'delivered': 'delivered',
      'completed': 'delivered',
      'cancelled': 'canceled',
      'cancelled_by_driver': 'canceled',
      'cancelled_by_passenger': 'canceled',
      'failed_delivery': 'failed',
      'failed': 'failed',
      'expired': 'failed',
    };

    return mapping[rideStatus] || null;
  }

  /**
   * Mapeia logistics_status de order para status de ride_request
   */
  static mapLogisticsStatusToRideStatus(logisticsStatus: string): string | null {
    const mapping: Record<string, string> = {
      'pending': 'requested',
      'accepted': 'driver_accepted',
      'preparing': 'driver_arriving',
      'ready_for_pickup': 'driver_arriving',
      'picked_up': 'pickup_confirmed',
      'in_transit': 'in_delivery',
      'delivered': 'delivered',
      'canceled': 'cancelled',
      'failed': 'failed',
    };

    return mapping[logisticsStatus] || null;
  }

  /**
   * Sincroniza order.logistics_status a partir do status canonico da entrega.
   * Nao quebra a operacao do motoboy se o pedido estiver em estado incompatível; registra log e retorna false.
   */
  static async syncRideStatusToOrder(params: {
    rideId: string;
    rideStatus?: string;
    actorProfileId?: string;
    reason?: string;
  }): Promise<boolean> {
    try {
      const ride = (await MobilityService.getRideById(params.rideId)) as LinkedRideRecord | null;
      if (!ride || ride.ride_mode !== "motoboy" || ride.source_type !== "gastronomy" || !ride.source_id) {
        return false;
      }

      const targetStatus = this.mapRideStatusToLogisticsStatus(params.rideStatus || ride.status || "");
      if (!targetStatus || targetStatus === LOGISTICS_STATUS.PENDING) {
        return false;
      }

      const actorProfileId =
        params.actorProfileId && params.actorProfileId !== "system"
          ? params.actorProfileId
          : ride.driver_profile_id || ride.passenger_profile_id || undefined;

      if (!actorProfileId) {
        logger.warn("[OrderDeliveryLinkService] Sem actor_profile_id para sincronizar pedido", {
          ride_id: ride.id,
          order_id: ride.source_id,
          targetStatus,
        });
        return false;
      }

      const orderResult = await OrderDeliverySSOTService.getOrderById(ride.source_id);
      if (!orderResult.success || !orderResult.data) {
        logger.warn("[OrderDeliveryLinkService] Pedido vinculado nao encontrado para sincronizacao", {
          ride_id: ride.id,
          order_id: ride.source_id,
          error: orderResult.error,
        });
        return false;
      }

      const currentStatus = orderResult.data.logistics_status;
      const path = this.resolveTransitionPath(currentStatus, targetStatus);
      if (path.length === 0) return false;

      for (const status of path) {
        const result = await this.applyOrderTransition({
          orderId: ride.source_id,
          status,
          actorProfileId,
          courierProfileId: ride.driver_profile_id || undefined,
          reason: params.reason || `Sincronizado pela entrega ${ride.id}`,
                  proof: ride.proof_of_delivery ?? undefined,
        });

        if (!result) return false;
      }

      if (targetStatus === LOGISTICS_STATUS.DELIVERED || targetStatus === LOGISTICS_STATUS.FAILED) {
        await this.persistDeliveryFinancialSnapshot({
          orderId: ride.source_id,
          actorProfileId,
          ride,
        });
      }

      return true;
    } catch (error) {
      logger.error("[OrderDeliveryLinkService] Erro ao sincronizar entrega com pedido", error as Error, {
        ride_id: params.rideId,
        ride_status: params.rideStatus,
      });
      return false;
    }
  }

  private static resolveTransitionPath(
    currentStatus: LogisticsStatus,
    targetStatus: LogisticsStatus,
  ): LogisticsStatus[] {
    if (currentStatus === targetStatus) return [];
    if (currentStatus === LOGISTICS_STATUS.DELIVERED || currentStatus === LOGISTICS_STATUS.CANCELED || currentStatus === LOGISTICS_STATUS.FAILED) {
      return [];
    }
    if (targetStatus === LOGISTICS_STATUS.CANCELED || targetStatus === LOGISTICS_STATUS.FAILED) {
      return [targetStatus];
    }

    const currentIndex = FORWARD_LOGISTICS_PATH.indexOf(currentStatus);
    const targetIndex = FORWARD_LOGISTICS_PATH.indexOf(targetStatus);
    if (currentIndex < 0 || targetIndex < 0 || targetIndex <= currentIndex) {
      return [];
    }

    return FORWARD_LOGISTICS_PATH.slice(currentIndex + 1, targetIndex + 1);
  }

  private static async applyOrderTransition(params: {
    orderId: string;
    status: LogisticsStatus;
    actorProfileId: string;
    courierProfileId?: string;
    reason: string;
    proof?: DeliveryProof;
  }): Promise<boolean> {
    const metadata = { source: "ride_request_sync" };
    const result =
      params.status === LOGISTICS_STATUS.PICKED_UP
        ? await OrderDeliverySSOTService.markPickedUp({
            order_id: params.orderId,
            actor_profile_id: params.actorProfileId,
            courier_profile_id: params.courierProfileId,
            reason: params.reason,
          })
        : params.status === LOGISTICS_STATUS.DELIVERED
          ? await OrderDeliverySSOTService.markDelivered({
              order_id: params.orderId,
              actor_profile_id: params.actorProfileId,
              reason: params.reason,
              proof: params.proof,
            })
          : params.status === LOGISTICS_STATUS.CANCELED
            ? await OrderDeliverySSOTService.cancelOrder({
                order_id: params.orderId,
                actor_profile_id: params.actorProfileId,
                reason: params.reason,
            })
            : params.status === LOGISTICS_STATUS.FAILED
              ? await OrderDeliverySSOTService.failOrder({
                  order_id: params.orderId,
                  actor_profile_id: params.actorProfileId,
                  reason: params.reason,
            })
              : await OrderDeliverySSOTService.transitionLogisticsStatus({
                  order_id: params.orderId,
                  to_status: params.status,
                  actor_profile_id: params.actorProfileId,
                  reason: params.reason,
                  metadata,
                });

    if (!result.success) {
      logger.warn("[OrderDeliveryLinkService] Falha ao aplicar status no pedido", {
        order_id: params.orderId,
        status: params.status,
        error: result.error,
      });
      return false;
    }

    return true;
  }

  private static async persistDeliveryFinancialSnapshot(params: {
    orderId: string;
    actorProfileId: string;
    ride: LinkedRideRecord;
  }): Promise<void> {
    const orderResult = await OrderDeliverySSOTService.getOrderById(params.orderId);
    if (!orderResult.success || !orderResult.data) {
      logger.warn("[OrderDeliveryLinkService] Nao foi possivel carregar pedido para snapshot financeiro", {
        order_id: params.orderId,
        error: orderResult.error,
      });
      return;
    }

    const metadata = asDeliveryOrderSourceMetadata(
      orderResult.data.source_context.source_type,
      orderResult.data.source_context.source_metadata,
    );
    const pricing = metadata.delivery_pricing;

    const feeCharged =
      pricing &&
      typeof pricing.fee_charged_to_customer === "number" &&
      Number.isFinite(pricing.fee_charged_to_customer)
        ? pricing.fee_charged_to_customer
        : orderResult.data.financial_breakdown.delivery_fee;

    const rawCourierCost =
      typeof params.ride.final_price === "number" && Number.isFinite(params.ride.final_price)
        ? params.ride.final_price
        : typeof params.ride.suggested_price === "number" && Number.isFinite(params.ride.suggested_price)
          ? params.ride.suggested_price
          : null;

    if (rawCourierCost === null) {
      return;
    }

    const courierCost = Number(rawCourierCost.toFixed(2));
    const margin = Number((feeCharged - courierCost).toFixed(2));

    const patch = {
      delivery_pricing: buildDeliveryPricingSnapshot({
        itemsSubtotal:
          pricing?.items_subtotal ?? orderResult.data.financial_breakdown.items_total,
        feeChargedToCustomer: feeCharged,
        orderTotal:
          pricing?.order_total ?? orderResult.data.financial_breakdown.order_total,
        courierCost,
        margin,
        finalizedAt: new Date().toISOString(),
      }),
      delivery_fee_customer: feeCharged,
    } satisfies Record<string, unknown>;

    const updateResult = await OrderDeliverySSOTService.updateOrderSourceMetadata({
      order_id: params.orderId,
      actor_profile_id: params.actorProfileId,
      metadata_patch: patch,
    });

    if (!updateResult.success) {
      logger.warn("[OrderDeliveryLinkService] Falha ao persistir snapshot financeiro da entrega", {
        order_id: params.orderId,
        error: updateResult.error,
      });
    }
  }
}
