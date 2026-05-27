import { describe, expect, it } from "vitest";

import { PizzaCartItemBuilder } from "../PizzaCartItemBuilder";
import { PizzaPricingService } from "../PizzaPricingService";
import { PizzaValidationService } from "../PizzaValidationService";
import { GastronomyOrderOriginAdapter } from "@/core/mobility/delivery/order/adapters/GastronomyOrderOriginAdapter";
import type { PizzaCatalog, PizzaFlavorSelection, PizzaPriceRuleType } from "../types";
import type { MenuItemWithRelations } from "@/modules/business/gastronomy/types/menu";

const item: MenuItemWithRelations = {
  id: "pizza-item",
  category_id: "cat-pizza",
  name: "Pizza Montavel",
  base_price: 0,
  is_vegetarian: false,
  is_vegan: false,
  is_gluten_free: false,
  is_lactose_free: false,
  is_spicy: false,
  is_available: true,
  is_featured: false,
  display_order: 1,
  metadata: {},
  created_at: "2026-04-25T00:00:00.000Z",
  updated_at: "2026-04-25T00:00:00.000Z",
  addons: [
    {
      id: "addon-extra-cheese",
      item_id: "pizza-item",
      name: "Queijo extra",
      price: 6,
      max_quantity: 2,
      is_available: true,
      display_order: 1,
      created_at: "2026-04-25T00:00:00.000Z",
      updated_at: "2026-04-25T00:00:00.000Z",
    },
  ],
};

const catalog: PizzaCatalog = {
  config: {
    id: "config",
    business_id: "business-1",
    default_price_rule: "highest_price",
    allow_half_half: true,
    allow_three_flavors: true,
    allow_four_flavors: true,
    is_active: true,
    created_at: "2026-04-25T00:00:00.000Z",
    updated_at: "2026-04-25T00:00:00.000Z",
  },
  sizes: [
    {
      id: "broto",
      business_id: "business-1",
      name: "Broto",
      slug: "broto",
      slices: 4,
      diameter_cm: 20,
      base_price: 10,
      max_flavors: 1,
      display_order: 1,
      is_available: true,
      created_at: "2026-04-25T00:00:00.000Z",
      updated_at: "2026-04-25T00:00:00.000Z",
    },
    {
      id: "media",
      business_id: "business-1",
      name: "Media",
      slug: "media",
      slices: 6,
      diameter_cm: 30,
      base_price: 15,
      max_flavors: 2,
      display_order: 2,
      is_available: true,
      created_at: "2026-04-25T00:00:00.000Z",
      updated_at: "2026-04-25T00:00:00.000Z",
    },
    {
      id: "grande",
      business_id: "business-1",
      name: "Grande",
      slug: "grande",
      slices: 8,
      diameter_cm: 35,
      base_price: 20,
      max_flavors: 3,
      display_order: 3,
      is_available: true,
      created_at: "2026-04-25T00:00:00.000Z",
      updated_at: "2026-04-25T00:00:00.000Z",
    },
    {
      id: "familia",
      business_id: "business-1",
      name: "Familia",
      slug: "familia",
      slices: 12,
      diameter_cm: 45,
      base_price: 30,
      max_flavors: 4,
      display_order: 4,
      is_available: true,
      created_at: "2026-04-25T00:00:00.000Z",
      updated_at: "2026-04-25T00:00:00.000Z",
    },
  ],
  flavors: [
    {
      id: "calabresa",
      business_id: "business-1",
      name: "Calabresa",
      base_price: 40,
      is_available: true,
      is_vegetarian: false,
      is_vegan: false,
      is_spicy: false,
      allergens: [],
      ingredients: [],
      display_order: 1,
      created_at: "2026-04-25T00:00:00.000Z",
      updated_at: "2026-04-25T00:00:00.000Z",
    },
    {
      id: "portuguesa",
      business_id: "business-1",
      name: "Portuguesa",
      base_price: 50,
      is_available: true,
      is_vegetarian: false,
      is_vegan: false,
      is_spicy: false,
      allergens: [],
      ingredients: [],
      display_order: 2,
      created_at: "2026-04-25T00:00:00.000Z",
      updated_at: "2026-04-25T00:00:00.000Z",
    },
    {
      id: "frango",
      business_id: "business-1",
      name: "Frango com Catupiry",
      base_price: 60,
      is_available: true,
      is_vegetarian: false,
      is_vegan: false,
      is_spicy: false,
      allergens: [],
      ingredients: [],
      display_order: 3,
      created_at: "2026-04-25T00:00:00.000Z",
      updated_at: "2026-04-25T00:00:00.000Z",
    },
    {
      id: "marguerita",
      business_id: "business-1",
      name: "Marguerita",
      base_price: 45,
      is_available: true,
      is_vegetarian: true,
      is_vegan: false,
      is_spicy: false,
      allergens: [],
      ingredients: [],
      display_order: 4,
      created_at: "2026-04-25T00:00:00.000Z",
      updated_at: "2026-04-25T00:00:00.000Z",
    },
    {
      id: "indisponivel",
      business_id: "business-1",
      name: "Indisponivel",
      base_price: 70,
      is_available: false,
      is_vegetarian: false,
      is_vegan: false,
      is_spicy: false,
      allergens: [],
      ingredients: [],
      display_order: 5,
      created_at: "2026-04-25T00:00:00.000Z",
      updated_at: "2026-04-25T00:00:00.000Z",
    },
  ],
  edges: [
    {
      id: "catupiry",
      business_id: "business-1",
      name: "Catupiry",
      price: 8,
      is_available: true,
      display_order: 1,
      created_at: "2026-04-25T00:00:00.000Z",
      updated_at: "2026-04-25T00:00:00.000Z",
    },
  ],
  doughs: [
    {
      id: "tradicional",
      business_id: "business-1",
      name: "Tradicional",
      price_adjustment: 0,
      is_available: true,
      display_order: 1,
      created_at: "2026-04-25T00:00:00.000Z",
      updated_at: "2026-04-25T00:00:00.000Z",
    },
    {
      id: "pan",
      business_id: "business-1",
      name: "Pan",
      price_adjustment: 5,
      is_available: true,
      display_order: 2,
      created_at: "2026-04-25T00:00:00.000Z",
      updated_at: "2026-04-25T00:00:00.000Z",
    },
  ],
};

function calculate(rule: PizzaPriceRuleType, selection: PizzaFlavorSelection[]) {
  return PizzaPricingService.calculate({
    size: catalog.sizes[2],
    flavors: catalog.flavors,
    flavor_selection: selection,
    rule,
    edge: catalog.edges[0],
    dough: catalog.doughs[1],
    quantity: 1,
  });
}

describe("PizzaPricingService", () => {
  it("calcula pizza 1 sabor", () => {
    const result = calculate("highest_price", [{ flavor_id: "calabresa", fraction: 1 }]);
    expect(result.unit_price).toBe(73);
  });

  it("calcula pizza meio a meio com highest_price", () => {
    const result = calculate("highest_price", [
      { flavor_id: "calabresa", fraction: 0.5 },
      { flavor_id: "portuguesa", fraction: 0.5 },
    ]);
    expect(result.unit_price).toBe(83);
  });

  it("calcula pizza 3 sabores", () => {
    const result = calculate("highest_price", [
      { flavor_id: "calabresa", fraction: 1 / 3 },
      { flavor_id: "portuguesa", fraction: 1 / 3 },
      { flavor_id: "frango", fraction: 1 / 3 },
    ]);
    expect(result.unit_price).toBe(93);
  });

  it("calcula pizza 4 sabores", () => {
    const result = PizzaPricingService.calculate({
      size: catalog.sizes[3],
      flavors: catalog.flavors,
      flavor_selection: [
        { flavor_id: "calabresa", fraction: 0.25 },
        { flavor_id: "portuguesa", fraction: 0.25 },
        { flavor_id: "frango", fraction: 0.25 },
        { flavor_id: "marguerita", fraction: 0.25 },
      ],
      rule: "highest_price",
      quantity: 1,
    });
    expect(result.unit_price).toBe(90);
  });

  it("calcula average_price", () => {
    const result = calculate("average_price", [
      { flavor_id: "calabresa", fraction: 0.5 },
      { flavor_id: "portuguesa", fraction: 0.5 },
    ]);
    expect(result.unit_price).toBe(78);
  });

  it("calcula weighted_average", () => {
    const result = calculate("weighted_average", [
      { flavor_id: "calabresa", fraction: 0.25 },
      { flavor_id: "portuguesa", fraction: 0.75 },
    ]);
    expect(result.unit_price).toBe(80.5);
  });

  it("calcula fixed_base_plus_flavors", () => {
    const result = calculate("fixed_base_plus_flavors", [
      { flavor_id: "calabresa", fraction: 0.5 },
      { flavor_id: "portuguesa", fraction: 0.5 },
    ]);
    expect(result.unit_price).toBe(78);
  });
});

describe("PizzaValidationService", () => {
  it("bloqueia sabores acima do limite do tamanho", () => {
    const result = PizzaValidationService.validateBuild({
      size: catalog.sizes[1],
      flavors: catalog.flavors,
      flavor_selection: [
        { flavor_id: "calabresa", fraction: 1 / 3 },
        { flavor_id: "portuguesa", fraction: 1 / 3 },
        { flavor_id: "frango", fraction: 1 / 3 },
      ],
    });
    expect(result.is_valid).toBe(false);
  });

  it("bloqueia sabor indisponivel", () => {
    const result = PizzaValidationService.validateBuild({
      size: catalog.sizes[0],
      flavors: catalog.flavors,
      flavor_selection: [{ flavor_id: "indisponivel", fraction: 1 }],
    });
    expect(result.is_valid).toBe(false);
  });
});

describe("PizzaCartItemBuilder", () => {
  it("gera carrinho com pizza composta e snapshot estruturado", () => {
    const cartItem = PizzaCartItemBuilder.build(
      {
        item,
        business_id: "business-1",
        size_id: "media",
        flavors: [
          { flavor_id: "calabresa", fraction: 0.5 },
          { flavor_id: "portuguesa", fraction: 0.5 },
        ],
        edge_id: "catupiry",
        dough_id: "pan",
        addon_quantities: { "addon-extra-cheese": 1 },
        quantity: 2,
      },
      catalog,
    );

    expect(cartItem.name).toBe("Pizza Media - 2 sabores");
    expect(cartItem.structured_item?.kind).toBe("pizza");
    expect(cartItem.subtotal).toBe(162);
    expect(cartItem.structured_item?.snapshot).toMatchObject({
      niche_key: "pizza",
      flavor_count: 2,
      price_rule: "highest_price",
      quantity: 2,
      line_total: 162,
    });
  });

  it("gera item de checkout com snapshot estruturado da pizza", () => {
    const cartItem = PizzaCartItemBuilder.build(
      {
        item,
        business_id: "business-1",
        size_id: "media",
        flavors: [
          { flavor_id: "calabresa", fraction: 0.5 },
          { flavor_id: "portuguesa", fraction: 0.5 },
        ],
        edge_id: "catupiry",
        dough_id: "pan",
        quantity: 1,
      },
      catalog,
    );
    const createOrderInput = GastronomyOrderOriginAdapter.toCreateOrderInput({
      customer_profile_id: "customer-1",
      actor_profile_id: "customer-1",
      business: {
        business_data_id: "business-1",
        profile_id: "merchant-1",
        name: "Pizzaria Teste",
        gastronomy_profile: {
          delivery_enabled: true,
          cuisine_type: "pizza",
          minimum_order: null,
        },
      },
      cart: {
        business_id: "business-1",
        items: [cartItem],
        subtotal: cartItem.subtotal,
        delivery_fee: 0,
        total: cartItem.subtotal,
      },
    });
    const checkoutItem = createOrderInput.items[0];

    expect(checkoutItem.item_snapshot.structured_item).toMatchObject({
      kind: "pizza",
      snapshot: {
        niche_key: "pizza",
        size: { name: "Media" },
        flavor_count: 2,
        flavors: [
          { name: "Calabresa", fraction: 0.5 },
          { name: "Portuguesa", fraction: 0.5 },
        ],
        edge: { name: "Catupiry" },
        dough: { name: "Pan" },
      },
    });
  });
});
