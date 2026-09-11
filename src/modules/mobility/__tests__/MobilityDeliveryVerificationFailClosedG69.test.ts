import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(relativePath: string): string {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), "utf8");
}

describe("G69 delivery verification fail-closed authority", () => {
  it("distinguishes verification read failure from an authoritative no-PIN state", () => {
    const service = readProjectFile(
      "src/core/mobility/services/OperationalVerificationService.ts",
    );
    const delivery = readProjectFile(
      "src/core/mobility/core/RideDeliveryOperationalActions.ts",
    );

    expect(service).toContain("getVerificationStatusResult");
    expect(delivery).toContain(
      "OperationalVerificationService.getVerificationStatusResult(rideId)",
    );
    expect(delivery).toContain("if (!verificationResult.success)");
    expect(delivery).toContain("Delivery verification state is unavailable");
  });

  it("does not fall back to the compatibility null-returning read in delivery confirmation", () => {
    const delivery = readProjectFile(
      "src/core/mobility/core/RideDeliveryOperationalActions.ts",
    );
    const confirmation = delivery.slice(
      delivery.indexOf("export async function confirmDeliveryOperation"),
      delivery.indexOf("export async function failDeliveryOperation"),
    );

    expect(confirmation).not.toContain("getVerificationStatus(rideId)");
    expect(confirmation).toContain("getVerificationStatusResult(rideId)");
    expect(confirmation).toContain("OperationalVerificationService.verifyPIN");
    expect(confirmation).toContain("RIDE_STATE.DELIVERED");
    expect(confirmation).toContain("RIDE_STATE.COMPLETED");
  });
});
