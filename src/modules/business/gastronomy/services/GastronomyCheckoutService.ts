/**
 * GastronomyCheckoutService â€” SSOT de checkout de gastronomia
 * 
 * INTEGRAÃ‡ÃƒO CORRETA:
 * 1. Usa OrderDeliverySSOTService (tabela orders)
 * 2. Usa GastronomyOrderOriginAdapter para conversÃ£o
 * 3. NÃƒO usa delivery_requests legado
 * 
 * Fluxo:
 * Cart â†’ Adapter â†’ OrderDeliverySSOTService.createOrder â†’ orders table
 */

import { logger } from "@/shared/utils/logger";
import type { Cart } from "../types/menu";
import type { GastronomyBusiness } from "../types/gastronomy";
import { OrderDeliverySSOTService } from "@/core/mobility/delivery/services/OrderDeliverySSOTService";
import { GastronomyOrderOriginAdapter } from "@/core/mobility/delivery/order/adapters/GastronomyOrderOriginAdapter";
import type { OrderRecord } from "@/core/mobility/delivery/order/types";
import { DeliveryAreaService } from "./DeliveryAreaService";

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

/**
 * Converte OrderRecord (SSOT) para formato legado de resposta
 * MantÃ©m compatibilidade com cÃ³digo existente
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
   * 1. Converte Cart â†’ CreateOrderInput via GastronomyOrderOriginAdapter
   * 2. Cria pedido em orders table via OrderDeliverySSOTService
   * 3. Retorna formato compatÃ­vel com cÃ³digo existente
   */
  static async createOrder(
    input: CreateGastronomyCheckoutOrderInput,
  ): Promise<GastronomyCheckoutOrderRecord> {
    try {
      if (input.business.gastronomy_profile.delivery_enabled) {
        const neighborhood = input.delivery_snapshot?.neighborhood?.trim();
        const city = input.delivery_snapshot?.city?.trim();
        const state = input.delivery_snapshot?.state?.trim();

        if (!neighborhood || !city || !state) {
          throw new Error(
            "Destino de entrega incompleto. Informe bairro, cidade e estado para validar a area.",
          );
        }

        const eligibilityResult = await DeliveryAreaService.checkEligibility(
          input.business.business_data_id,
          neighborhood,
          city,
          state,
          input.cart.total,
        );

        if (eligibilityResult.error || !eligibilityResult.data) {
          throw new Error(
            eligibilityResult.error ||
              "Nao foi possivel validar sua area de entrega no momento.",
          );
        }

        if (!eligibilityResult.data.is_eligible) {
          throw new Error(
            eligibilityResult.data.message ||
              "Este endereco esta fora da area de entrega deste estabelecimento.",
          );
        }
      }

      // Converte cart de gastronomia para input de pedido SSOT
      const createOrderInput = GastronomyOrderOriginAdapter.toCreateOrderInput({
        customer_profile_id: input.customer_profile_id,
        actor_profile_id: input.actor_profile_id,
        business: input.business,
        cart: input.cart,
        payment_method: input.payment_method,
        notes: input.notes,
        customer_snapshot: input.customer_snapshot,
        delivery_snapshot: input.delivery_snapshot,
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
