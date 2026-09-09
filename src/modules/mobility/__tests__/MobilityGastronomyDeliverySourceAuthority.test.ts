import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function read(relativePath: string): string {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), "utf8");
}

describe("Gastronomy mobility source authority", () => {
  it("binds a delivery ride to an order owned by the authorized merchant", () => {
    const broker = read("supabase/functions/mobility-rpc/index.ts");
    const hook = read("src/modules/mobility/hooks/useMotoboy.ts");

    expect(broker).toContain("requireGastronomyOrderSourceBinding");
    expect(broker).toContain('.from("orders")');
    expect(broker).toContain(
      '.select("id, merchant_profile_id, source_type, source_id, logistics_status")',
    );
    expect(broker).toContain(
      "order.merchant_profile_id !== business.profileId",
    );
    expect(broker).toContain('order.source_type !== "gastronomy"');
    expect(broker).toContain(
      "order.source_id !== business.businessId",
    );
    expect(broker).toContain(
      "Gastronomy order does not belong to the authorized business",
    );
    expect(broker).toContain(
      "Gastronomy order already has an active delivery ride",
    );
    expect(broker).toContain(
      'sourceType === "gastronomy"',
    );

    expect(hook).toContain(
      "sourceId: orderId",
    );
    expect(hook).toContain(
      "authorizationSourceId: restaurantId",
    );
  });
});
