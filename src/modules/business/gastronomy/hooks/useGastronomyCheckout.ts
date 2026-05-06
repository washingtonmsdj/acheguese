import { useMutation } from "@tanstack/react-query";
import { useShallow } from "zustand/react/shallow";

import { useSessionContext } from "@/core/session";
import { useGastronomyCartStore } from "../cart/useGastronomyCartStore";
import {
  GastronomyCheckoutService,
  type GastronomyCheckoutOrderRecord,
} from "../services/GastronomyCheckoutService";
import type { GastronomyBusiness } from "../types/gastronomy";
import type { Cart } from "../types/menu";
import { useMotoboy } from "@/modules/mobility/hooks/useMotoboy";
import { logger } from "@/shared/utils/logger";
import { toast } from "sonner";

export interface DeliveryAddress {
  id: string;
  lat: number;
  lng: number;
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

export function useGastronomyCheckout() {
  const { activeProfile } = useSessionContext();
  const clearCart = useGastronomyCartStore(
    useShallow((state) => state.clearCart),
  );

  // Hook de mobilidade para criar ride_request
  const motoboy = useMotoboy({
    sourceType: 'gastronomy',
    sourceId: undefined, // Será definido por pedido
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

      // 1. Criar pedido no SSOT (orders table)
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
            }
          : undefined,
      });

      logger.info('[useGastronomyCheckout] Pedido criado', {
        order_id: order.id,
        business_id: input.business.business_data_id,
        delivery_enabled: input.business.gastronomy_profile.delivery_enabled,
      });

      // 2. Se delivery habilitado, criar ride_request para rastreamento GPS
      if (input.business.gastronomy_profile.delivery_enabled && input.deliveryAddress) {
        try {
          // Validar dados necessários
          if (!input.business.address_id) {
            throw new Error('Estabelecimento sem address_id configurado');
          }
          if (!input.business.location_id) {
            throw new Error('Estabelecimento sem location_id configurado');
          }
          if (!input.business.lat || !input.business.lng) {
            throw new Error('Estabelecimento sem coordenadas configuradas');
          }

          logger.info('[useGastronomyCheckout] Criando ride_request para rastreamento', {
            order_id: order.id,
            pickup: { lat: input.business.lat, lng: input.business.lng },
            dropoff: { lat: input.deliveryAddress.lat, lng: input.deliveryAddress.lng },
          });

          // Criar ride_request (rastreamento GPS)
          const deliveryResult = await motoboy.requestDelivery({
            // Endereços canônicos
            pickupAddressId: input.business.address_id,
            dropoffAddressId: input.deliveryAddress.id,
            pickupLocationId: input.business.location_id,
            dropoffLocationId: input.business.location_id, // Mesma cidade
            
            // Coordenadas (obrigatórias para pricing e rota)
            originLat: input.business.lat,
            originLng: input.business.lng,
            destinationLat: input.deliveryAddress.lat,
            destinationLng: input.deliveryAddress.lng,
            
            // Dados da entrega
            recipientName: input.deliveryAddress.recipient_name || activeProfile.full_name || 'Cliente',
            recipientPhone: input.deliveryAddress.phone || activeProfile.phone,
            deliveryNotes: input.notes,
            packageDescription: `Pedido #${order.id} - ${input.business.name}`,
            packageSize: 'medium',
            
            // Origem da solicitação
            sourceType: 'gastronomy',
            sourceId: order.id,
            authorizationSourceId: input.business.business_data_id,
            
            // Pagamento
            paymentMethod: input.payment_method,
          });

          if (deliveryResult.success) {
            logger.info('[useGastronomyCheckout] Rastreamento GPS ativado com sucesso', {
              order_id: order.id,
              ride_id: deliveryResult.data?.id,
            });
            
            toast.success('Pedido criado! Buscando entregador...');
          } else {
            // Não falhar o pedido se rastreamento falhar
            logger.warn('[useGastronomyCheckout] Rastreamento não disponível', {
              order_id: order.id,
              error: deliveryResult.error,
            });
            
            toast.warning('Pedido criado, mas rastreamento não disponível no momento');
          }
        } catch (deliveryError) {
          // Não falhar o pedido se rastreamento falhar
          logger.error('[useGastronomyCheckout] Erro ao ativar rastreamento', deliveryError as Error, {
            order_id: order.id,
            business_id: input.business.business_data_id,
          });
          
          toast.warning('Pedido criado, mas rastreamento não disponível no momento');
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
