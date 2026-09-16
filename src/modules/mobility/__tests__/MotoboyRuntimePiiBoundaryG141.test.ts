import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("G141 motoboy runtime PII boundary", () => {
  const queries = readProjectFile(
    "src/core/mobility/services/mobility.queries.ts",
  );
  const actions = readProjectFile(
    "src/core/mobility/components/driver/MotoboyDeliveryActions.tsx",
  );

  it("validates sensitive delivery schema without materializing a database row", () => {
    const start = queries.indexOf("const rideColumnsResult");
    const end = queries.indexOf("const driverDataColumnsResult", start);
    const schemaProbe = queries.slice(start, end);

    expect(schemaProbe).toContain('"recipient_phone"');
    expect(schemaProbe).toContain('"proof_of_delivery"');
    expect(schemaProbe).toContain("{ head: true }");
  });

  it("exposes delivery contact data only after driver acceptance and before terminal state", () => {
    expect(actions).toContain("DELIVERY_PII_VISIBLE_STATUSES");
    expect(actions).toContain("RIDE_STATUS.DRIVER_ACCEPTED");
    expect(actions).toContain("RIDE_STATUS.DRIVER_ARRIVING");
    expect(actions).toContain("RIDE_STATUS.PICKUP_CONFIRMED");
    expect(actions).toContain("RIDE_STATUS.IN_DELIVERY");
    expect(actions).toContain("!DELIVERY_PII_VISIBLE_STATUSES.has(ride.status)");
    expect(actions).not.toMatch(/DELIVERY_PII_VISIBLE_STATUSES[\s\S]*RIDE_STATUS\.COMPLETED/);
    expect(actions).not.toMatch(/DELIVERY_PII_VISIBLE_STATUSES[\s\S]*RIDE_STATUS\.DELIVERED/);
    expect(actions).not.toMatch(/DELIVERY_PII_VISIBLE_STATUSES[\s\S]*RIDE_STATUS\.FAILED_DELIVERY/);
  });
});
