/**
 * GastronomyCheckoutService - SSOT de checkout de gastronomia.
 *
 * Fluxo:
 * Cart -> GastronomyOrderOriginAdapter -> OrderDeliverySSOTService.createOrder -> orders.
 */

import { logger } from "@/shared/utils/logger";
import type { Cart } from "../types/menu";
import type { GastronomyBusiness } from "../types/gastronomy";
import { OrderDeliverySSOTService } from "@/core/mobility/delivery/services/OrderDeliverySSOTService";
import { GastronomyOrderOriginAdapter } from "@/core/mobility/delivery/order/adapters/GastronomyOrderOriginAdapter";
import type { OrderRecord } from "@/core/mobility/delivery/order/types";
import { DeliveryAreaService } from "./DeliveryAreaService";

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

export class GastronomyCheckoutService {
  static async createOrder(
    input: CreateGastronomyCheckoutOrderInput,
  ): Promise<OrderRecord> {
    try {
      if (input.business.gastronomy_profile.delivery_enabled) {
        const neighborhood = input.delivery_snapshot?.neighborhood?.trim();
        const city = input.delivery_snapshot?.city?.trim();
        const state = input.delivery_snapshot?.state?.trim();

        if (!neighborhood || !city || !state) {
          throw new Error(
            "Destino de entrega incompleto. Informe bairro, cidade e estado para validar a área.",
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
              "Não foi possível validar sua área de entrega no momento.",
          );
        }

        if (!eligibilityResult.data.is_eligible) {
          throw new Error(
            eligibilityResult.data.message ||
              "Este endereço está fora da área de entrega deste estabelecimento.",
          );
        }
      }

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

      const result = await OrderDeliverySSOTService.createOrder(createOrderInput);

      if (!result.success || !result.data) {
        throw new Error(result.error || "Falha ao criar pedido.");
      }

      logger.info("[GastronomyCheckoutService] Pedido criado com sucesso via SSOT", {
        order_id: result.data.id,
        customer_profile_id: input.customer_profile_id,
        business_id: input.business.business_data_id,
      });

      return result.data;
    } catch (error) {
      logger.error("[GastronomyCheckoutService] Erro ao criar pedido", error as Error, {
        customer_profile_id: input.customer_profile_id,
        business_data_id: input.business.business_data_id,
      });
      throw error;
    }
  }
}
