import { describe, expect, it } from "vitest";

import { GastronomyCartService } from "@/modules/business/gastronomy/cart/GastronomyCartService";
import type { MenuItemWithRelations } from "@/modules/business/gastronomy/types";

function makeMenuItem(
  overrides: Partial<MenuItemWithRelations> = {},
): MenuItemWithRelations {
  return {
    id: "item-1",
    category_id: "category-1",
    name: "Pizza Especial",
    description: "Molho da casa",
    base_price: 32,
    is_vegetarian: false,
    is_vegan: false,
    is_gluten_free: false,
    is_lactose_free: false,
    is_spicy: false,
    is_available: true,
    is_featured: false,
    display_order: 1,
    metadata: {},
    created_at: "2026-04-08T00:00:00.000Z",
    updated_at: "2026-04-08T00:00:00.000Z",
    variants: [
      {
        id: "variant-large",
        item_id: "item-1",
        name: "Grande",
        price_adjustment: 8,
        is_default: true,
        is_available: true,
        display_order: 1,
        created_at: "2026-04-08T00:00:00.000Z",
        updated_at: "2026-04-08T00:00:00.000Z",
      },
    ],
    addons: [
      {
        id: "addon-cheese",
        item_id: "item-1",
        name: "Extra queijo",
        price: 5,
        max_quantity: 3,
        is_available: true,
        display_order: 1,
        created_at: "2026-04-08T00:00:00.000Z",
        updated_at: "2026-04-08T00:00:00.000Z",
      },
    ],
    ...overrides,
  };
}

describe("GastronomyCartService", () => {
  it("calcula subtotal da linha com variante e adicionais", () => {
    const cartItem = GastronomyCartService.buildCartItem({
      item: makeMenuItem(),
      quantity: 2,
      variant_id: "variant-large",
      addon_quantities: {
        "addon-cheese": 2,
      },
      special_instructions: "sem cebola",
    });

    expect(cartItem.line_id).toBeTruthy();
    expect(cartItem.variant?.price_adjustment).toBe(8);
    expect(cartItem.addons).toHaveLength(1);
    expect(cartItem.subtotal).toBe(90);
  });

  it("acumula totais do carrinho com taxa de entrega", () => {
    const cartItem = GastronomyCartService.buildCartItem({
      item: makeMenuItem(),
      quantity: 1,
      variant_id: "variant-large",
      addon_quantities: {
        "addon-cheese": 1,
      },
    });

    const cart = GastronomyCartService.appendItem(null, {
      business_id: "business-1",
      delivery_fee: 7.5,
      cart_item: cartItem,
    });

    expect(cart.subtotal).toBe(45);
    expect(cart.delivery_fee).toBe(7.5);
    expect(cart.total).toBe(52.5);
    expect(GastronomyCartService.getItemCount(cart)).toBe(1);
  });

  it("zera taxa de entrega para carrinho de retirada", () => {
    const cartItem = GastronomyCartService.buildCartItem({
      item: makeMenuItem({
        variants: [],
        addons: [],
        base_price: 24,
      }),
    });

    const cart = GastronomyCartService.appendItem(null, {
      business_id: "business-1",
      delivery_fee: 7.5,
      fulfillment_mode: "takeout",
      cart_item: cartItem,
    });

    expect(cart.fulfillment_mode).toBe("takeout");
    expect(cart.subtotal).toBe(24);
    expect(cart.delivery_fee).toBe(0);
    expect(cart.total).toBe(24);
  });

  it("reinicia o carrinho ao trocar de estabelecimento", () => {
    const firstCart = GastronomyCartService.appendItem(null, {
      business_id: "business-1",
      delivery_fee: 6,
      cart_item: GastronomyCartService.buildCartItem({
        item: makeMenuItem(),
      }),
    });

    const secondCart = GastronomyCartService.appendItem(firstCart, {
      business_id: "business-2",
      delivery_fee: 9,
      cart_item: GastronomyCartService.buildCartItem({
        item: makeMenuItem({
          id: "item-2",
          name: "Burger",
          variants: [],
          addons: [],
          base_price: 24,
        }),
      }),
    });

    expect(secondCart.business_id).toBe("business-2");
    expect(secondCart.items).toHaveLength(1);
    expect(secondCart.subtotal).toBe(24);
    expect(secondCart.total).toBe(33);
  });

  it("informa quanto falta para atingir pedido minimo", () => {
    const cart = GastronomyCartService.appendItem(null, {
      business_id: "business-1",
      delivery_fee: 4,
      cart_item: GastronomyCartService.buildCartItem({
        item: makeMenuItem({
          variants: [],
          addons: [],
          base_price: 18,
        }),
      }),
    });

    expect(GastronomyCartService.getMinimumOrderRemaining(cart, 25)).toBe(7);
    expect(GastronomyCartService.isMinimumOrderReached(cart, 25)).toBe(false);
    expect(GastronomyCartService.isMinimumOrderReached(cart, 18)).toBe(true);
  });
});
