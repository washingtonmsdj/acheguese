import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("G135 bounded static ride lookup", () => {
  const legacyImpl = readProjectFile(
    "src/core/mobility/services/MobilityService.impl.ts",
  );
  const authorization = readProjectFile(
    "src/core/mobility/services/MotoboyAuthorizationService.ts",
  );
  const runtime = readProjectFile(
    "src/core/mobility/services/MobilityRuntimeService.ts",
  );

  it("delegates the legacy static lookup to the bounded lifecycle reader", () => {
    const start = legacyImpl.indexOf("static async getRideById");
    const end = legacyImpl.indexOf("static async getRidesByPassenger", start);
    const method = legacyImpl.slice(start, end);

    expect(method).toContain("RideOperationalContextReadService.getLifecycle(id)");
    expect(method).not.toContain('select("*")');
  });

  it("keeps motoboy cancellation authorization limited to requester ownership", () => {
    const start = authorization.indexOf("static async canCancelDelivery");
    const end = authorization.indexOf("private static async resolveAuthenticatedUserId", start);
    const method = authorization.slice(start, end);

    expect(method).toContain("MobilityService.getRideById(rideId)");
    expect(method).toContain("passenger_profile_id");
    expect(method).not.toContain("recipient_phone");
    expect(method).not.toContain("proof_of_delivery");
  });

  it("does not conflate the bounded static lookup with the UI runtime reader", () => {
    expect(runtime).toContain("async getRideById(rideId: string)");
    expect(runtime).toContain("toRideRequestContract");
  });
});
