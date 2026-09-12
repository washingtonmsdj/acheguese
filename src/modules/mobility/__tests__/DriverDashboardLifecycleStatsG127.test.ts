import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("G127 driver dashboard lifecycle stats", () => {
  const hook = readProjectFile(
    "src/core/mobility/hooks/useDriverDashboardBase.ts",
  );

  it("counts only completed rides as payable", () => {
    expect(hook).toContain("return ride.status === RIDE_STATE.COMPLETED");
    expect(hook).not.toContain(
      "RIDE_STATUS.COMPLETED || ride.status === RIDE_STATUS.DELIVERED",
    );
  });

  it("uses the shared cancellation classifier for fallback stats", () => {
    expect(hook).toContain("isCancelledRideStatus(ride.status)");
    expect(hook).not.toContain(
      "rides.filter((ride) => ride.status === RIDE_STATUS.CANCELLED).length",
    );
  });
});
