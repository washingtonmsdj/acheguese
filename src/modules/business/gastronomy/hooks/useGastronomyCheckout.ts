import { useMutation } from "@tanstack/react-query";
import { useShallow } from "zustand/react/shallow";

import { locationGeocodingService } from "@/core/location/services/LocationGeocodingService";
import { useSessionContext } from "@/core/session";
import type { OrderRecord } from "@/core/mobility/delivery/order/types";
import { logger } from "@/shared/utils/logger";
import { useGastronomyCartStore } from "../cart/useGastronomyCartStore";
import {
  normalizeFulfillmentMode,
  requiresDeliveryDestination,
  resolveDeliveryFulfillmentMode,
  type GastronomyFulfillmentMode,
} from "../checkout/checkoutRules";
import { GastronomyCheckoutService } from "../services/GastronomyCheckoutService";
import type { GastronomyBusiness } from "../types/gastronomy";
import type { Cart } from "../types/menu";

export interface DeliveryAddress {
  id: string;
  lat: number;
  lng: number;
  label?: string;
  locationId?: string;
  postal_code?: string;
  street?: string;
  number?: string;
  complement?: string;
  reference?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  recipient_name?: string;
  phone?: string;
}

export interface GastronomyCheckoutInput {
  business: GastronomyBusiness;
  cart: Cart;
  fulfillment_mode?: GastronomyFulfillmentMode;
  payment_method?: string;
  notes?: string;
  deliveryAddress?: DeliveryAddress;
}

async function resolveDeliveryLocationInfo(
  deliveryAddress: DeliveryAddress,
): Promise<{
  neighborhood: string;
  city: string;
  state: string;
}> {
  if (
    deliveryAddress.neighborhood &&
    deliveryAddress.city &&
    deliveryAddress.state
  ) {
    return {
      neighborhood: deliveryAddress.neighborhood,
      city: deliveryAddress.city,
      state: deliveryAddress.state,
    };
  }

  const reverse = await locationGeocodingService.reverseGeocode({
    latitude: deliveryAddress.lat,
    longitude: deliveryAddress.lng,
    detailLevel: "full",
  });

  if (!reverse) {
    throw new Error(
      "Não foi possível validar o endereço de entrega. Informe um endereço mais completo.",
    );
  }

  const info = locationGeocodingService.extractLocationInfo(reverse);
  if (!info.neighborhood || !info.city || !info.state) {
    throw new Error(
      "Endereço sem bairro, cidade e estado válidos para calcular área de entrega.",
    );
  }

  return {
    neighborhood: info.neighborhood,
    city: info.city,
    state: info.state,
  };
}

export function useGastronomyCheckout() {
  const { activeProfile } = useSessionContext();
  const clearCart = useGastronomyCartStore(
    useShallow((state) => state.clearCart),
  );

  const mutation = useMutation({
    mutationFn: async (
      input: GastronomyCheckoutInput,
    ): Promise<OrderRecord> => {
      if (!activeProfile?.id) {
        throw new Error("Selecione um perfil ativo para concluir o pedido.");
      }

      if (!input.cart.items.length) {
        throw new Error("O carrinho precisa ter pelo menos um item.");
      }

      let deliveryLocationInfo: {
        neighborhood: string;
        city: string;
        state: string;
      } | null = null;

      const fulfillmentMode = normalizeFulfillmentMode(
        input.business,
        input.fulfillment_mode ?? input.cart.fulfillment_mode,
      );
      const isDeliveryOrder = requiresDeliveryDestination(fulfillmentMode);
      const deliveryFulfillmentMode = resolveDeliveryFulfillmentMode(
        input.business,
      );

      if (isDeliveryOrder && deliveryFulfillmentMode === "platform_courier") {
        logger.warn(
          "[useGastronomyCheckout] Configuracao de entrega nao suportada no checkout oficial",
          {
            business_id: input.business.business_data_id,
            fulfillment_mode: fulfillmentMode,
            delivery_fulfillment_mode: deliveryFulfillmentMode,
          },
        );
        throw new Error(
          "Entrega por rede de motoboy ainda não está disponível neste lançamento. Ajuste a loja para frota própria ou use retirada/no local.",
        );
      }

      if (isDeliveryOrder) {
        if (!input.deliveryAddress) {
          throw new Error(
            "Defina um destino de entrega válido antes de concluir o pedido.",
          );
        }

        deliveryLocationInfo = await resolveDeliveryLocationInfo(
          input.deliveryAddress,
        );

      }

      const order = await GastronomyCheckoutService.createOrder({
        customer_profile_id: activeProfile.id,
        actor_profile_id: activeProfile.id,
        business: input.business,
        cart: input.cart,
        fulfillment_mode: fulfillmentMode,
        payment_method: input.payment_method,
        notes: input.notes,
        customer_snapshot: {
          full_name: activeProfile.displayName || activeProfile.name,
          phone: activeProfile.phone,
          email: undefined,
        },
        delivery_snapshot:
          isDeliveryOrder && input.deliveryAddress
            ? {
                address_id: input.deliveryAddress.id,
                lat: input.deliveryAddress.lat,
                lng: input.deliveryAddress.lng,
                recipient_name: input.deliveryAddress.recipient_name,
                phone: input.deliveryAddress.phone,
                postal_code: input.deliveryAddress.postal_code,
                street: input.deliveryAddress.street,
                number: input.deliveryAddress.number,
                complement: input.deliveryAddress.complement,
                reference: input.deliveryAddress.reference,
                neighborhood: deliveryLocationInfo?.neighborhood,
                city: deliveryLocationInfo?.city,
                state: deliveryLocationInfo?.state,
              }
            : undefined,
      });

      logger.info("[useGastronomyCheckout] Pedido criado", {
        order_id: order.id,
        business_id: input.business.business_data_id,
        fulfillment_mode: fulfillmentMode,
        delivery_fulfillment_mode: deliveryFulfillmentMode,
      });

      return order;
    },
    onSuccess: () => {
      clearCart();
    },
  });

  return {
    checkout: mutation.mutateAsync,
    createdOrder: mutation.data ?? null,
    isSubmitting: mutation.isPending,
    errorMessage:
      mutation.error instanceof Error ? mutation.error.message : null,
    hasActiveProfile: !!activeProfile?.id,
  };
}
