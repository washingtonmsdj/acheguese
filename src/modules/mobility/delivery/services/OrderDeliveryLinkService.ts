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

export interface OrderDeliveryLink {
  order_id: string;
  ride_request_id: string;
  created_at: string;
}

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
  static mapRideStatusToLogisticsStatus(rideStatus: string): string | null {
    const mapping: Record<string, string> = {
      'requested': 'pending',
      'searching_driver': 'pending',
      'driver_assigned': 'accepted',
      'driver_accepted': 'accepted',
      'driver_arriving': 'preparing',
      'pickup_confirmed': 'picked_up',
      'in_delivery': 'in_transit',
      'delivered': 'delivered',
      'cancelled': 'canceled',
      'cancelled_by_driver': 'canceled',
      'cancelled_by_passenger': 'canceled',
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
}
