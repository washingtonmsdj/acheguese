import { useMutation } from "@tanstack/react-query";
import { useShallow } from "zustand/react/shallow";

import { locationGeocodingService } from "@/core/location/services/LocationGeocodingService";
import { useSessionContext } from "@/core/session";
import { useMotoboy } from "@/core/mobility/hooks";
import { toast } from "sonner";
import { useGastronomyCartStore } from "../cart/useGastronomyCartStore";
import { DeliveryAreaService } from "../services/DeliveryAreaService";
import { GastronomyCheckoutService } from "../services/GastronomyCheckoutService";
import type { OrderRecord } from "@/core/mobility/delivery/order/types";
import type { GastronomyBusiness } from "../types/gastronomy";
import type { Cart } from "../types/menu";
import { logger } from "@/shared/utils/logger";

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
  payment_method?: string;
  notes?: string;
  deliveryAddress?: DeliveryAddress;
}

type DeliveryPaymentMethod = "pix" | "dinheiro" | "cartao" | "link";

function resolveDeliveryPaymentContext(paymentMethod?: string): {
  deliveryPaymentMethod: DeliveryPaymentMethod;
  shouldCollectOnDelivery: boolean;
  operationalLabel: string;
} {
  switch (paymentMethod) {
    case "cash":
      return {
        deliveryPaymentMethod: "dinheiro",
        shouldCollectOnDelivery: true,
        operationalLabel: "dinheiro",
      };
    case "card_on_delivery":
      return {
        deliveryPaymentMethod: "cartao",
        shouldCollectOnDelivery: true,
        operationalLabel: "cartao",
      };
    case "payment_link":
      return {
        deliveryPaymentMethod: "link",
        shouldCollectOnDelivery: false,
        operationalLabel: "link",
      };
    case "pix":
    default:
      return {
        deliveryPaymentMethod: "pix",
        shouldCollectOnDelivery: true,
        operationalLabel: "pix",
      };
  }
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

  const motoboy = useMotoboy({
    sourceType: "gastronomy",
    sourceId: undefined,
  });

  const resolveBusinessCoords = (business: GastronomyBusiness): { lat: number; lng: number } | null => {
    const lat = business.address?.latitude ?? business.location?.canonical_lat;
    const lng = business.address?.longitude ?? business.location?.canonical_lng;
    if (typeof lat === "number" && typeof lng === "number" && Number.isFinite(lat) && Number.isFinite(lng)) {
      return { lat, lng };
    }
    return null;
  };

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

      let deliveryLocationInfo:
        | { neighborhood: string; city: string; state: string }
        | null = null;

      if (input.business.gastronomy_profile.delivery_enabled) {
        if (!input.deliveryAddress) {
          throw new Error(
            "Defina um destino de entrega válido antes de concluir o pedido.",
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

      const order = await GastronomyCheckoutService.createOrder({
        customer_profile_id: activeProfile.id,
        actor_profile_id: activeProfile.id,
        business: input.business,
        cart: input.cart,
        payment_method: input.payment_method,
        notes: input.notes,
        customer_snapshot: {
          full_name: activeProfile.displayName || activeProfile.name,
          phone: activeProfile.phone,
          email: typeof activeProfile.email === "string" ? activeProfile.email : undefined,
        },
        delivery_snapshot: input.deliveryAddress
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
        delivery_enabled: input.business.gastronomy_profile.delivery_enabled,
      });

      if (
        input.business.gastronomy_profile.delivery_enabled &&
        input.deliveryAddress &&
        input.business.address_id &&
        input.business.location_id
      ) {
        try {
          const businessCoords = resolveBusinessCoords(input.business);
          if (!businessCoords) {
            throw new Error("Estabelecimento sem coordenadas configuradas");
          }

          logger.info("[useGastronomyCheckout] Criando ride_request para rastreamento", {
            order_id: order.id,
            pickup: { lat: businessCoords.lat, lng: businessCoords.lng },
            dropoff: { lat: input.deliveryAddress.lat, lng: input.deliveryAddress.lng },
          });

          // Minimização de dados: o motoboy recebe somente informações operacionais
          // necessárias para localizar o destino (sem observações gerais/pagamento).
          const paymentContext = resolveDeliveryPaymentContext(input.payment_method);
          const orderSubtotal = Number.isFinite(input.cart.subtotal) ? input.cart.subtotal : 0;
          const orderDeliveryFee = Number.isFinite(input.cart.delivery_fee) ? input.cart.delivery_fee : 0;
          const orderTotal = Number.isFinite(input.cart.total) ? input.cart.total : 0;
          const orderSubtotalLabel = `R$ ${orderSubtotal.toFixed(2)}`;
          const orderDeliveryFeeLabel = `R$ ${orderDeliveryFee.toFixed(2)}`;
          const orderTotalLabel = `R$ ${orderTotal.toFixed(2)}`;
          const motoboyNotes = [
            `PEDIDO_SUBTOTAL: ${orderSubtotalLabel}`,
            `TAXA_ENTREGA_CLIENTE: ${orderDeliveryFeeLabel}`,
            `PEDIDO_TOTAL: ${orderTotalLabel}`,
            `COBRAR_NA_ENTREGA: ${paymentContext.shouldCollectOnDelivery ? "sim" : "não"}`,
            `FORMA_PAGAMENTO: ${paymentContext.operationalLabel}`,
            input.deliveryAddress.postal_code
              ? `CEP ${input.deliveryAddress.postal_code}`
              : null,
            input.deliveryAddress.street
              ? `${input.deliveryAddress.street}${input.deliveryAddress.number ? `, ${input.deliveryAddress.number}` : ''}`
              : null,
            input.deliveryAddress.complement
              ? `Complemento: ${input.deliveryAddress.complement}`
              : null,
            input.deliveryAddress.reference
              ? `Referência: ${input.deliveryAddress.reference}`
              : null,
          ]
            .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
            .join(' | ');

          const deliveryResult = await motoboy.requestDelivery({
            pickupAddressId: input.business.address_id,
            dropoffAddressId: input.deliveryAddress.id,
            pickupLocationId: input.business.location_id,
            dropoffLocationId:
              input.deliveryAddress.locationId || input.business.location_id,

            originLat: businessCoords.lat,
            originLng: businessCoords.lng,
            destinationLat: input.deliveryAddress.lat,
            destinationLng: input.deliveryAddress.lng,

            recipientName:
              input.deliveryAddress.recipient_name ||
              activeProfile.displayName ||
              activeProfile.name ||
              "Cliente",
            recipientPhone: input.deliveryAddress.phone || activeProfile.phone,
            deliveryNotes: motoboyNotes || undefined,
            packageDescription: `Pedido #${order.id} - ${input.business.name} - Total ${orderTotalLabel}`,
            packageSize: "medium",

            sourceType: "gastronomy",
            sourceId: order.id,
            authorizationSourceId: input.business.business_data_id,

            paymentMethod: paymentContext.deliveryPaymentMethod,
          });

          if (deliveryResult.success) {
            logger.info("[useGastronomyCheckout] Rastreamento GPS ativado com sucesso", {
              order_id: order.id,
              ride_id: deliveryResult.rideId,
            });

            toast.success("Pedido criado! Buscando entregador...");
          } else {
            logger.warn("[useGastronomyCheckout] Rastreamento não disponível", {
              order_id: order.id,
              error: deliveryResult.error,
            });

            toast.warning("Pedido criado, mas rastreamento não disponível no momento");
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

          toast.warning("Pedido criado, mas rastreamento não disponível no momento");
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
