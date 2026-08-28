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
import { DeliveryAreaService } from "@/core/business/services/GastronomyDeliveryAreaService";
import {
  isPlatformCourierUnavailableForCheckout,
  normalizeFulfillmentMode,
  requiresDeliveryDestination,
  resolveAcceptedPaymentMethods,
  type GastronomyCheckoutPaymentMethod,
  type GastronomyFulfillmentMode,
} from "../checkout/checkoutRules";

export interface CreateGastronomyCheckoutOrderInput {
  customer_profile_id: string;
  actor_profile_id: string;
  business: GastronomyBusiness;
  cart: Cart;
  fulfillment_mode?: GastronomyFulfillmentMode;
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
      const fulfillmentMode = normalizeFulfillmentMode(
        input.business,
        input.fulfillment_mode ?? input.cart.fulfillment_mode,
      );

      if (!input.cart.items.length) {
        throw new Error("O carrinho precisa ter pelo menos um item.");
      }

      if (isPlatformCourierUnavailableForCheckout(input.business, fulfillmentMode)) {
        throw new Error(
          "Entrega por rede de motoboy ainda nao esta disponivel neste lancamento. Ajuste a loja para frota propria ou use retirada/no local.",
        );
      }

      const normalizedPaymentMethod = input.payment_method?.trim().toLowerCase();
      const paymentMethod = normalizedPaymentMethod
        ? (normalizedPaymentMethod as GastronomyCheckoutPaymentMethod)
        : undefined;
      if (paymentMethod) {
        const acceptedPaymentMethods = resolveAcceptedPaymentMethods(input.business);
        if (!acceptedPaymentMethods.has(paymentMethod)) {
          throw new Error(
            "Forma de pagamento indisponivel para este estabelecimento.",
          );
        }
      }

      if (requiresDeliveryDestination(fulfillmentMode)) {
        const postalCode = input.delivery_snapshot?.postal_code?.trim();
        const street = input.delivery_snapshot?.street?.trim();
        const number = input.delivery_snapshot?.number?.trim();
        const neighborhood = input.delivery_snapshot?.neighborhood?.trim();
        const city = input.delivery_snapshot?.city?.trim();
        const state = input.delivery_snapshot?.state?.trim();

        if (!postalCode || !street || !number || !neighborhood || !city || !state) {
          throw new Error(
            "Destino de entrega incompleto. Informe CEP, rua, numero, bairro, cidade e estado para validar a area.",
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

      const createOrderInput = GastronomyOrderOriginAdapter.toCreateOrderInput({
        customer_profile_id: input.customer_profile_id,
        actor_profile_id: input.actor_profile_id,
        business: input.business,
        cart: input.cart,
        fulfillment_mode: fulfillmentMode,
        payment_method: paymentMethod,
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
