import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("G136 source-linked ride pricing boundary", () => {
  const mobilityImpl = readProjectFile(
    "src/core/mobility/services/MobilityService.impl.ts",
  );
  const orderService = readProjectFile(
    "src/modules/business/gastronomy/services/OrderService.ts",
  );

  it("keeps the source-linked compatibility lookup pricing-only", () => {
    const methodStart = mobilityImpl.indexOf("static async getLatestRideBySource(");
    const methodEnd = mobilityImpl.indexOf("static async getRideSourceIdById(", methodStart);
    const method = mobilityImpl.slice(methodStart, methodEnd);

    expect(method).toContain('.select("final_price, suggested_price")');
    expect(method).not.toContain('select("*")');
    expect(method).not.toContain("recipient_name");
    expect(method).not.toContain("passenger_profile_id");
    expect(method).not.toContain("driver_profile_id");
    expect(method).not.toContain("origin");
    expect(method).not.toContain("destination");
  });

  it("uses source identity only as query predicates", () => {
    const interfaceStart = mobilityImpl.indexOf("interface SourceLinkedRidePricingRow");
    const interfaceEnd = mobilityImpl.indexOf("const db", interfaceStart);
    const rowContract = mobilityImpl.slice(interfaceStart, interfaceEnd);

    expect(rowContract).toContain("final_price: number | null");
    expect(rowContract).toContain("suggested_price: number | null");
    expect(rowContract).not.toContain("source_type:");
    expect(rowContract).not.toContain("source_id:");
    expect(rowContract).not.toContain("status:");
    expect(rowContract).not.toContain("id:");
  });

  it("keeps gastronomy enrichment on the bounded pricing lookup", () => {
    expect(orderService).toContain("MobilityService.getLatestRideBySource(");
    expect(orderService).toContain("ride.final_price");
    expect(orderService).toContain("ride.suggested_price");
    expect(orderService).not.toContain("MobilityService.getRideById(order.id)");
  });
});
