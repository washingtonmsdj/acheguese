/**
 * GastronomyCheckoutService — SSOT de checkout de gastronomia
 * 
 * INTEGRAÇÃO CORRETA:
 * 1. Usa OrderDeliverySSOTService (tabela orders)
 * 2. Usa GastronomyOrderOriginAdapter para conversão
 * 3. NÃO usa delivery_requests legado
 * 
 * Fluxo:
 * Cart → Adapter → OrderDeliverySSOTService.createOrder → orders table
 */

import { logger } from "@/shared/utils/logger";
import type { Cart } from "../types/menu";
import type { GastronomyBusiness } from "../types/gastronomy";
import { OrderDeliverySSOTService } from "@/modules/mobility/delivery/services/OrderDeliverySSOTService";
import { GastronomyOrderOriginAdapter } from "@/modules/mobility/delivery/order/adapters/GastronomyOrderOriginAdapter";
import type { OrderRecord } from "@/modules/mobility/delivery/order/types";

export interface GastronomyCheckoutOrderRecord {
  id: string;
  customer_profile_id: string;
  merchant_profile_id: string;
  source_type: string | null;
  source_id: string | null;
  source_reference: string | null;
  logistics_status: string | null;
  financial_status: string | null;
  payment_method: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateGastronomyCheckoutOrderInput {
  customer_profile_id: string;
  actor_profile_id: string;
  business: GastronomyBusiness;
  cart: Cart;
  payment_method?: string;
  notes?: string;
}

/**
 * Converte OrderRecord (SSOT) para formato legado de resposta
 * Mantém compatibilidade com código existente
 */
function orderRecordToCheckoutRecord(order: OrderRecord): GastronomyCheckoutOrderRecord {
  return {
    id: order.id,
    customer_profile_id: order.customer_profile_id,
    merchant_profile_id: order.merchant_profile_id,
    source_type: order.source_context.source_type,
    source_id: order.source_context.source_id,
    source_reference: order.source_context.source_reference,
    logistics_status: order.logistics_status,
    financial_status: order.financial_status,
    payment_method: order.payment_method,
    notes: order.notes,
    created_at: order.created_at,
    updated_at: order.updated_at,
  };
}

export class GastronomyCheckoutService {
  /**
   * Cria pedido usando SSOT correto (OrderDeliverySSOTService)
   * 
   * Fluxo:
   * 1. Converte Cart → CreateOrderInput via GastronomyOrderOriginAdapter
   * 2. Cria pedido em orders table via OrderDeliverySSOTService
   * 3. Retorna formato compatível com código existente
   */
  static async createOrder(
    input: CreateGastronomyCheckoutOrderInput,
  ): Promise<GastronomyCheckoutOrderRecord> {
    try {
      // Converte cart de gastronomia para input de pedido SSOT
      const createOrderInput = GastronomyOrderOriginAdapter.toCreateOrderInput({
        customer_profile_id: input.customer_profile_id,
        actor_profile_id: input.actor_profile_id,
        business: input.business,
        cart: input.cart,
        payment_method: input.payment_method,
        notes: input.notes,
      });

      // Cria pedido usando SSOT
      const result = await OrderDeliverySSOTService.createOrder(createOrderInput);

      if (!result.success || !result.data) {
        throw new Error(result.error || "Falha ao criar pedido.");
      }

      logger.info("[GastronomyCheckoutService] Pedido criado com sucesso via SSOT", {
        order_id: result.data.id,
        customer_profile_id: input.customer_profile_id,
        business_id: input.business.business_data_id,
      });

      // Converte para formato legado (compatibilidade)
      return orderRecordToCheckoutRecord(result.data);

    } catch (error) {
      logger.error("[GastronomyCheckoutService] Erro ao criar pedido", error as Error, {
        customer_profile_id: input.customer_profile_id,
        business_data_id: input.business.business_data_id,
      });
      throw error;
    }
  }
}


