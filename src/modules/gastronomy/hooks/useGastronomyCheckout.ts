import { useMutation } from "@tanstack/react-query";
import { useShallow } from "zustand/react/shallow";

import { useSessionContext } from "@/core/session";
import { useOrderDelivery } from "@/core/delivery";
import { GastronomyOrderOriginAdapter } from "@/core/delivery";
import type { OrderRecord } from "@/core/delivery";
import type { GastronomyBusiness } from "../types/gastronomy";
import type { Cart } from "../types/menu";
import { useGastronomyCartStore } from "../cart/useGastronomyCartStore";

export interface GastronomyCheckoutInput {
  business: GastronomyBusiness;
  cart: Cart;
  payment_method?: string;
  notes?: string;
}

export function useGastronomyCheckout() {
  const { activeProfile } = useSessionContext();
  const { createOrder } = useOrderDelivery();
  const clearCart = useGastronomyCartStore(
    useShallow((state) => state.clearCart),
  );

  const mutation = useMutation({
    mutationFn: async (input: GastronomyCheckoutInput): Promise<OrderRecord> => {
      if (!activeProfile?.id) {
        throw new Error("Selecione um perfil ativo para concluir o pedido.");
      }

      if (!input.cart.items.length) {
        throw new Error("O carrinho precisa ter pelo menos um item.");
      }

      const draft = GastronomyOrderOriginAdapter.toCreateOrderInput({
        customer_profile_id: activeProfile.id,
        actor_profile_id: activeProfile.id,
        business: input.business,
        cart: input.cart,
        payment_method: input.payment_method,
        notes: input.notes,
      });

      const { actor_profile_id: _actorProfileId, ...payload } = draft;
      const result = await createOrder(payload);

      if (!result.success || !result.data) {
        throw new Error(result.error || "Falha ao criar o pedido.");
      }

      return result.data;
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
