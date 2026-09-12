import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("G133 ride operational orchestrator boundary", () => {
  const orchestrator = readProjectFile(
    "src/core/mobility/core/RideOperationalService.ts",
  );

  it("never returns to the generic ride reader for lifecycle decisions", () => {
    expect(orchestrator).not.toContain("getRideById");
    expect(orchestrator).toContain("RideOperationalContextReadService.getLifecycle");
  });

  it("keeps state transition authority in the state machine and server RPCs", () => {
    expect(orchestrator).toContain("RideStateMachine.assertCanTransition");
    expect(orchestrator).toContain("MobilityRpcService.transitionRideState");
    expect(orchestrator).toContain("MobilityRpcService.transitionDeliveryState");
  });

  it("uses bounded context for actor checks during cancellation and completion", () => {
    expect(orchestrator).toContain("ride.passenger_profile_id !== input.profileId");
    expect(orchestrator).toContain("ride.driver_profile_id !== input.profileId");
    expect(orchestrator).toContain("ride.driver_profile_id !== driverProfileId");
    expect(orchestrator).not.toContain('select("*")');
  });
});
