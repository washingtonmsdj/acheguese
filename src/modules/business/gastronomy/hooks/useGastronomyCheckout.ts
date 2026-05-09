import { useMutation } from "@tanstack/react-query";
import { useShallow } from "zustand/react/shallow";

import { locationGeocodingService } from "@/core/location/services/LocationGeocodingService";
import { useSessionContext } from "@/core/session";
import { useMotoboy } from "@/modules/mobility/hooks/useMotoboy";
import { toast } from "sonner";
import { useGastronomyCartStore } from "../cart/useGastronomyCartStore";
import { DeliveryAreaService } from "../services/DeliveryAreaService";
import {
  GastronomyCheckoutService,
  type GastronomyCheckoutOrderRecord,
} from "../services/GastronomyCheckoutService";
import type { GastronomyBusiness } from "../types/gastronomy";
import type { Cart } from "../types/menu";
import { logger } from "@/shared/utils/logger";

export interface DeliveryAddress {
  id: string;
  lat: number;
  lng: number;
  label?: string;
  locationId?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  recipient_name?: string;
  phone?: string;
}

export interface GastronomyCheckoutInput {
  business: GastronomyBusiness;
  cart: Cart;
  payment_method?: string;
  notes?: string;
  deliveryAddress?: DeliveryAddress;
}

async function resolveDeliveryLocationInfo(deliveryAddress: DeliveryAddress): Promise<{
  neighborhood: string;
  city: string;
  state: string;
}> {
  if (deliveryAddress.neighborhood && deliveryAddress.city && deliveryAddress.state) {
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
      "Nao foi possivel validar o endereco de entrega. Informe um endereco mais completo.",
    );
  }

  const info = locationGeocodingService.extractLocationInfo(reverse);
  if (!info.neighborhood || !info.city || !info.state) {
    throw new Error(
      "Endereco sem bairro, cidade e estado validos para calcular area de entrega.",
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

  const motoboy = useMotoboy({
    sourceType: "gastronomy",
    sourceId: undefined,
  });

  const mutation = useMutation({
    mutationFn: async (
      input: GastronomyCheckoutInput,
    ): Promise<GastronomyCheckoutOrderRecord> => {
      if (!activeProfile?.id) {
        throw new Error("Selecione um perfil ativo para concluir o pedido.");
      }

      if (!input.cart.items.length) {
        throw new Error("O carrinho precisa ter pelo menos um item.");
      }

      let deliveryLocationInfo:
        | { neighborhood: string; city: string; state: string }
        | null = null;

      if (input.business.gastronomy_profile.delivery_enabled) {
        if (!input.deliveryAddress) {
          throw new Error(
            "Defina um destino de entrega valido antes de concluir o pedido.",
          );
        }

        deliveryLocationInfo = await resolveDeliveryLocationInfo(
          input.deliveryAddress,
        );

        const eligibilityResult = await DeliveryAreaService.checkEligibility(
          input.business.business_data_id,
          deliveryLocationInfo.neighborhood,
          deliveryLocationInfo.city,
          deliveryLocationInfo.state,
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

      const order = await GastronomyCheckoutService.createOrder({
        customer_profile_id: activeProfile.id,
        actor_profile_id: activeProfile.id,
        business: input.business,
        cart: input.cart,
        payment_method: input.payment_method,
        notes: input.notes,
        customer_snapshot: {
          full_name: activeProfile.full_name,
          phone: activeProfile.phone,
          email: activeProfile.email,
        },
        delivery_snapshot: input.deliveryAddress
          ? {
              address_id: input.deliveryAddress.id,
              lat: input.deliveryAddress.lat,
              lng: input.deliveryAddress.lng,
              recipient_name: input.deliveryAddress.recipient_name,
              phone: input.deliveryAddress.phone,
              neighborhood: deliveryLocationInfo?.neighborhood,
              city: deliveryLocationInfo?.city,
              state: deliveryLocationInfo?.state,
            }
          : undefined,
      });

      logger.info("[useGastronomyCheckout] Pedido criado", {
        order_id: order.id,
        business_id: input.business.business_data_id,
        delivery_enabled: input.business.gastronomy_profile.delivery_enabled,
      });

      if (
        input.business.gastronomy_profile.delivery_enabled &&
        input.deliveryAddress &&
        input.business.address_id &&
        input.business.location_id
      ) {
        try {
          if (!input.business.lat || !input.business.lng) {
            throw new Error("Estabelecimento sem coordenadas configuradas");
          }

          logger.info("[useGastronomyCheckout] Criando ride_request para rastreamento", {
            order_id: order.id,
            pickup: { lat: input.business.lat, lng: input.business.lng },
            dropoff: { lat: input.deliveryAddress.lat, lng: input.deliveryAddress.lng },
          });

          const deliveryResult = await motoboy.requestDelivery({
            pickupAddressId: input.business.address_id,
            dropoffAddressId: input.deliveryAddress.id,
            pickupLocationId: input.business.location_id,
            dropoffLocationId:
              input.deliveryAddress.locationId || input.business.location_id,

            originLat: input.business.lat,
            originLng: input.business.lng,
            destinationLat: input.deliveryAddress.lat,
            destinationLng: input.deliveryAddress.lng,

            recipientName:
              input.deliveryAddress.recipient_name ||
              activeProfile.full_name ||
              "Cliente",
            recipientPhone: input.deliveryAddress.phone || activeProfile.phone,
            deliveryNotes: input.notes,
            packageDescription: `Pedido #${order.id} - ${input.business.name}`,
            packageSize: "medium",

            sourceType: "gastronomy",
            sourceId: order.id,
            authorizationSourceId: input.business.business_data_id,

            paymentMethod: input.payment_method,
          });

          if (deliveryResult.success) {
            logger.info("[useGastronomyCheckout] Rastreamento GPS ativado com sucesso", {
              order_id: order.id,
              ride_id: deliveryResult.data?.id,
            });

            toast.success("Pedido criado! Buscando entregador...");
          } else {
            logger.warn("[useGastronomyCheckout] Rastreamento nao disponivel", {
              order_id: order.id,
              error: deliveryResult.error,
            });

            toast.warning("Pedido criado, mas rastreamento nao disponivel no momento");
          }
        } catch (deliveryError) {
          logger.error(
            "[useGastronomyCheckout] Erro ao ativar rastreamento",
            deliveryError as Error,
            {
              order_id: order.id,
              business_id: input.business.business_data_id,
            },
          );

          toast.warning("Pedido criado, mas rastreamento nao disponivel no momento");
        }
      }

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
