import { describe, expect, it } from "vitest";

import { GastronomyOrderOriginAdapter } from "./GastronomyOrderOriginAdapter";
import { FINANCIAL_STATUS } from "../../payment-context/types";

const baseBusiness = {
  business_data_id: "business-1",
  profile_id: "merchant-1",
  name: "Restaurante Teste",
  gastronomy_profile: {
    cuisine_type: "brasileira",
    delivery_enabled: false,
    takeout_enabled: true,
    dine_in_enabled: false,
    minimum_order: 10,
  },
};

const baseCart = {
  business_id: "business-1",
  fulfillment_mode: "takeout" as const,
  subtotal: 25,
  delivery_fee: 0,
  total: 25,
  items: [
    {
      item_id: "item-1",
      name: "Prato feito",
      base_price: 25,
      quantity: 1,
      addons: [],
      subtotal: 25,
    },
  ],
};

describe("GastronomyOrderOriginAdapter", () => {
  it("creates takeout orders without requiring delivery to be enabled", () => {
    const order = GastronomyOrderOriginAdapter.toCreateOrderInput({
      customer_profile_id: "customer-1",
      actor_profile_id: "customer-1",
      business: baseBusiness,
      cart: baseCart,
      fulfillment_mode: "takeout",
      payment_method: "pix",
    });

    expect(order.source_context?.source_type).toBe("gastronomy");
    expect(order.source_context?.source_metadata?.fulfillment_mode).toBe("takeout");
    expect(order.financial.delivery_fee).toBe(0);
    expect(order.initial_financial_status).toBe(FINANCIAL_STATUS.PENDING_PAYMENT);
  });

  it("rejects delivery orders when the business has delivery disabled", () => {
    expect(() =>
      GastronomyOrderOriginAdapter.toCreateOrderInput({
        customer_profile_id: "customer-1",
        actor_profile_id: "customer-1",
        business: baseBusiness,
        cart: {
          ...baseCart,
          fulfillment_mode: "delivery",
          delivery_fee: 5,
          total: 30,
        },
        fulfillment_mode: "delivery",
      }),
    ).toThrow(/nao esta habilitada para delivery/i);
  });

  it("keeps cash-like methods as not applicable by default", () => {
    const order = GastronomyOrderOriginAdapter.toCreateOrderInput({
      customer_profile_id: "customer-1",
      actor_profile_id: "customer-1",
      business: baseBusiness,
      cart: baseCart,
      fulfillment_mode: "takeout",
      payment_method: "cash",
    });

    expect(order.initial_financial_status).toBe(FINANCIAL_STATUS.NOT_APPLICABLE);
  });
});
