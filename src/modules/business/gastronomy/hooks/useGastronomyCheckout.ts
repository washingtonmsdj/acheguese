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

export interface GastronomyCheckoutInput {
  business: GastronomyBusiness;
  cart: Cart;
  payment_method?: string;
  notes?: string;
}

export function useGastronomyCheckout() {
  const { activeProfile } = useSessionContext();
  const clearCart = useGastronomyCartStore(
    useShallow((state) => state.clearCart),
  );

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

      return GastronomyCheckoutService.createOrder({
        customer_profile_id: activeProfile.id,
        actor_profile_id: activeProfile.id,
        business: input.business,
        cart: input.cart,
        payment_method: input.payment_method,
        notes: input.notes,
      });
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

