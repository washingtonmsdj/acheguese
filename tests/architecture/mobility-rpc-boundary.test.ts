import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const PROJECT_ROOT = process.cwd();

function read(relativePath: string): string {
  return fs.readFileSync(path.resolve(PROJECT_ROOT, relativePath), "utf8");
}

describe("mobility RPC ownership boundary", () => {
  it("keeps ride and delivery creation exclusively in mobility-create-rpc", () => {
    const operationalBroker = read("supabase/functions/mobility-rpc/index.ts");
    const creationBroker = read("supabase/functions/mobility-create-rpc/index.ts");

    expect(operationalBroker).not.toMatch(/\bcreateRide\s*:\s*true\b/);
    expect(operationalBroker).not.toMatch(/\bcreateDelivery\s*:\s*true\b/);
    expect(operationalBroker).not.toContain("handleCreateRide");
    expect(operationalBroker).not.toContain("handleCreateDelivery");
    expect(operationalBroker).not.toContain("rideCreationRpcParams");
    expect(operationalBroker).not.toContain('"mobility_create_ride_atomic"');
    expect(operationalBroker).not.toContain('"mobility_create_delivery_atomic"');

    expect(creationBroker).toContain(
      'type MobilityCreateAction = "createRide" | "createDelivery"',
    );
    expect(creationBroker).toContain('"mobility_create_ride_atomic"');
    expect(creationBroker).toContain('"mobility_create_delivery_atomic"');
  });

  it("never accepts browser-owned finalPrice in the operational broker", () => {
    const operationalBroker = read("supabase/functions/mobility-rpc/index.ts");

    expect(operationalBroker).not.toContain("params.finalPrice");
    expect(operationalBroker).not.toContain("params.final_price");
    expect(operationalBroker).not.toContain("p_final_price");
    expect(operationalBroker).not.toMatch(/\blet\s+finalPrice\b/);
  });
});
