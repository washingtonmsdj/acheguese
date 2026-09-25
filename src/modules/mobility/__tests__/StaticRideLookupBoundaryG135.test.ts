import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("G135 bounded ride lookup boundary", () => {
  const authorization = readProjectFile(
    "src/core/mobility/services/MotoboyAuthorizationService.ts",
  );
  const runtime = readProjectFile(
    "src/core/mobility/services/MobilityRuntimeService.ts",
  );

  it("retires the temporary static ride lookup wrapper", () => {
    expect(existsSync(resolve(process.cwd(), "src/core/mobility/services/MobilityService.impl.ts"))).toBe(false);
  });

  it("keeps motoboy cancellation authorization on the bounded lifecycle reader", () => {
    const start = authorization.indexOf("static async canCancelDelivery");
    const end = authorization.indexOf(
      "private static async resolveAuthenticatedUserId",
      start,
    );
    const method = authorization.slice(start, end);

    expect(method).toContain("RideOperationalContextReadService.getLifecycle(rideId)");
    expect(method).toContain("passenger_profile_id");
    expect(method).not.toContain("MobilityService.getRideById");
    expect(method).not.toContain("recipient_phone");
    expect(method).not.toContain("proof_of_delivery");
  });

  it("keeps the UI runtime reader separate", () => {
    expect(runtime).toContain("async getRideById(rideId: string)");
    expect(runtime).toContain("toRideRequestContract");
  });
});
