import { useEffect, useMemo } from "react";
import { useShallow } from "zustand/react/shallow";

import type { GastronomyBusiness } from "../types/gastronomy";
import type { Cart } from "../types/menu";
import { GastronomyCartService } from "../cart/GastronomyCartService";
import { useGastronomyCartStore } from "../cart/useGastronomyCartStore";

function buildEmptyBusinessCart(business: GastronomyBusiness): Cart {
  return GastronomyCartService.createEmptyCart(
    business.business_data_id,
    business.gastronomy_profile.delivery_fee ?? 0,
  );
}

export function useGastronomyCart(business?: GastronomyBusiness | null) {
  // useShallow evita re-renders quando o objeto retornado tem os mesmos valores
  const { cart, addItem, removeItem, clearCart, syncBusinessContext } = useGastronomyCartStore(
    useShallow((state) => ({
      cart: state.cart,
      addItem: state.addItem,
      removeItem: state.removeItem,
      clearCart: state.clearCart,
      syncBusinessContext: state.syncBusinessContext,
    })),
  );

  const businessId = business?.business_data_id;
  const deliveryFee = business?.gastronomy_profile.delivery_fee ?? 0;

  useEffect(() => {
    if (!businessId) return;

    syncBusinessContext({
      business_id: businessId,
      delivery_fee: deliveryFee,
    });
  }, [businessId, deliveryFee, syncBusinessContext]);

  return useMemo(() => {
    if (!business) {
      return {
        cart: cart,
        hasCart: !!cart,
        isCurrentBusinessCart: false,
        itemCount: GastronomyCartService.getItemCount(cart),
        minimumOrderRemaining: 0,
        minimumOrderReached: true,
        addItem,
        removeItem,
        clearCart,
      };
    }

    const isCurrentBusinessCart = cart?.business_id === business.business_data_id;
    const currentCart = isCurrentBusinessCart ? cart : buildEmptyBusinessCart(business);
    const minimumOrderRemaining = GastronomyCartService.getMinimumOrderRemaining(
      currentCart,
      business.gastronomy_profile.minimum_order,
    );

    return {
      cart: currentCart,
      hasCart: isCurrentBusinessCart && currentCart.items.length > 0,
      isCurrentBusinessCart,
      itemCount: GastronomyCartService.getItemCount(currentCart),
      minimumOrderRemaining,
      minimumOrderReached: minimumOrderRemaining === 0,
      addItem,
      removeItem,
      clearCart,
    };
  }, [addItem, business, cart, clearCart, removeItem]);
}
