import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("G136 source-linked ride pricing boundary", () => {
  const deliveryReader = readProjectFile(
    "src/core/mobility/delivery/services/OrderDeliveryLinkReadService.ts",
  );
  const orderService = readProjectFile(
    "src/modules/business/gastronomy/services/OrderService.ts",
  );

  it("retires the legacy static source-linked pricing compatibility lookup", () => {
    expect(existsSync(resolve(process.cwd(), "src/core/mobility/services/MobilityService.impl.ts"))).toBe(false);
  });

  it("keeps the dedicated order pricing lookup pricing-only", () => {
    const methodStart = deliveryReader.indexOf(
      "static async getLatestPricingByOrderId(",
    );
    const methodEnd = deliveryReader.indexOf("static async getByRideId(", methodStart);
    const method = deliveryReader.slice(methodStart, methodEnd);

    expect(method).toContain('.select("final_price, suggested_price")');
    expect(method).not.toContain('select("*")');
    expect(method).not.toContain("recipient_name");
    expect(method).not.toContain("passenger_profile_id");
    expect(method).not.toContain("driver_profile_id");
    expect(method).not.toContain("origin_lat");
    expect(method).not.toContain("destination_lat");
    expect(method).not.toContain("proof_of_delivery");
  });

  it("keeps gastronomy enrichment on the bounded delivery-link pricing authority", () => {
    expect(orderService).toContain(
      "OrderDeliveryLinkReadService.getLatestPricingByOrderId(order.id)",
    );
    expect(orderService).toContain("ride.final_price");
    expect(orderService).toContain("ride.suggested_price");
    expect(orderService).not.toContain("MobilityService.getLatestRideBySource(");
    expect(orderService).not.toContain(
      "OrderDeliveryLinkReadService.getLatestByOrderId(order.id)",
    );
  });
});
