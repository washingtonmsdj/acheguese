import { describe, expect, it } from "vitest";

import {
  asDeliveryOrderSourceMetadata,
  buildDeliveryPricingSnapshot,
} from "./sourceMetadata";

describe("sourceMetadata SSOT", () => {
  it("builds normalized delivery pricing snapshot", () => {
    const snapshot = buildDeliveryPricingSnapshot({
      itemsSubtotal: 49.999,
      feeChargedToCustomer: 10.001,
      orderTotal: 60.0,
      courierCost: 5.555,
      margin: 4.446,
    });

    expect(snapshot).toEqual({
      items_subtotal: 50,
      fee_charged_to_customer: 10,
      order_total: 60,
      courier_cost: 5.55,
      margin: 4.45,
      currency: "BRL",
    });
  });

  it("parses delivery metadata for all supported source types", () => {
    const metadata = {
      delivery_fee_customer: 12.5,
      delivery_pricing: {
        items_subtotal: 100,
        fee_charged_to_customer: 12.5,
        order_total: 112.5,
        courier_cost: 8,
        margin: 4.5,
        currency: "BRL" as const,
      },
    };

    const gastronomy = asDeliveryOrderSourceMetadata("gastronomy", metadata);
    const business = asDeliveryOrderSourceMetadata("business", metadata);
    const service = asDeliveryOrderSourceMetadata("service", metadata);

    expect(gastronomy.delivery_fee_customer).toBe(12.5);
    expect(business.delivery_pricing?.courier_cost).toBe(8);
    expect(service.delivery_pricing?.margin).toBe(4.5);
  });

  it("returns empty object for unsupported source type", () => {
    const result = asDeliveryOrderSourceMetadata("manual", {
      delivery_fee_customer: 9,
    });

    expect(result).toEqual({});
  });
});

