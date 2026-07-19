import { describe, expect, it } from "vitest";

import {
  BusinessOrderOriginAdapter,
  ServiceOrderOriginAdapter,
} from "./BusinessServiceOrderOriginAdapter";

describe("BusinessServiceOrderOriginAdapter", () => {
  const baseInput = {
    customer_profile_id: "customer-1",
    actor_profile_id: "actor-1",
    merchant_profile_id: "merchant-1",
    source_id: "source-1",
    source_reference: "Origem Teste",
    items: [
      {
        name: "Item A",
        quantity: 2,
        unit_price: 20,
      },
      {
        name: "Item B",
        quantity: 1,
        unit_price: 10,
      },
    ],
    financial: {
      delivery_fee: 5,
      discount_total: 0,
    },
  };

  it("builds business source order with canonical metadata", () => {
    const order = BusinessOrderOriginAdapter.toCreateOrderInput(baseInput);

    expect(order.source_context?.source_type).toBe("business");
    expect(order.financial.items_total).toBe(50);
    expect(order.financial.delivery_fee).toBe(5);
    expect(order.financial.discount_total).toBe(0);
    expect(order.source_context?.source_metadata?.delivery_order_total).toBe(55);
  });

  it("builds service source order with canonical metadata", () => {
    const order = ServiceOrderOriginAdapter.toCreateOrderInput(baseInput);

    expect(order.source_context?.source_type).toBe("service");
    expect(order.source_context?.source_metadata?.delivery_items_subtotal).toBe(50);
    expect(order.source_context?.source_metadata?.delivery_fee_customer).toBe(5);
  });

  it("rejects divergent line_total", () => {
    expect(() =>
      BusinessOrderOriginAdapter.toCreateOrderInput({
        ...baseInput,
        items: [
          {
            name: "Item C",
            quantity: 1,
            unit_price: 10,
            line_total: 999,
          },
        ],
      }),
    ).toThrow(/line_total divergente/i);
  });
});

