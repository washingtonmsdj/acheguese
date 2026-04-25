import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { Cart, CartItem } from "../types/menu";
import {
  GastronomyCartService,
  type BuildCartItemInput,
} from "./GastronomyCartService";

interface GastronomyCartStoreState {
  cart: Cart | null;
  addItem: (input: {
    business_id: string;
    delivery_fee: number;
    item_input: BuildCartItemInput;
  }) => Cart;
  addCartItem: (input: {
    business_id: string;
    delivery_fee: number;
    cart_item: CartItem;
  }) => Cart;
  removeItem: (lineId: string) => void;
  clearCart: () => void;
  syncBusinessContext: (input: {
    business_id: string;
    delivery_fee: number;
  }) => void;
}

export const useGastronomyCartStore = create<GastronomyCartStoreState>()(
  persist(
    (set) => ({
      cart: null,

      addItem: ({ business_id, delivery_fee, item_input }) => {
        const cartItem = GastronomyCartService.buildCartItem(item_input);

        let nextCart: Cart | null = null;
        set((state) => {
          nextCart = GastronomyCartService.appendItem(state.cart, {
            business_id,
            delivery_fee,
            cart_item: cartItem,
          });

          return {
            cart: nextCart,
          };
        });

        return nextCart as Cart;
      },

      addCartItem: ({ business_id, delivery_fee, cart_item }) => {
        let nextCart: Cart | null = null;
        set((state) => {
          nextCart = GastronomyCartService.appendItem(state.cart, {
            business_id,
            delivery_fee,
            cart_item,
          });

          return {
            cart: nextCart,
          };
        });

        return nextCart as Cart;
      },

      removeItem: (lineId) =>
        set((state) => ({
          cart: GastronomyCartService.removeItem(state.cart, lineId),
        })),

      clearCart: () => set({ cart: null }),

      syncBusinessContext: ({ business_id, delivery_fee }) =>
        set((state) => {
          if (!state.cart) return state;
          if (state.cart.business_id !== business_id) return state;

          return {
            cart: GastronomyCartService.syncDeliveryFee(
              state.cart,
              delivery_fee,
            ),
          };
        }),
    }),
    {
      name: "gastronomy-cart-store",
      partialize: (state) => ({
        cart: state.cart,
      }),
    },
  ),
);
