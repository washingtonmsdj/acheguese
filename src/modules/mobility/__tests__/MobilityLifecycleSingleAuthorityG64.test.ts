import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { getDriverRideActionAvailability } from "@/core/mobility/core/DriverRideActionPolicy";

function readProjectFile(path: string): string {
  return readFileSync(join(process.cwd(), path), "utf8");
}

const helpers = readProjectFile("src/core/mobility/services/mobility.helpers.ts");
const facade = readProjectFile("src/core/mobility/services/MobilityService.ts");
const ridesTab = readProjectFile(
  "src/core/mobility/components/driver/DriverRidesTab.tsx",
);
const ridesLayout = readProjectFile(
  "src/core/mobility/components/driver/DriverRidesLayout.tsx",
);
const canonicalList = readProjectFile(
  "src/core/mobility/components/driver/CanonicalDriverRidesList.tsx",
);

describe("G64 single lifecycle authority", () => {
  it("derives driver actions from the canonical state machine", () => {
    expect(getDriverRideActionAvailability("driver_assigned")).toEqual({
      canStart: false,
      canComplete: false,
      canCancel: true,
    });
    expect(getDriverRideActionAvailability("driver_accepted")).toEqual({
      canStart: false,
      canComplete: false,
      canCancel: true,
    });
    expect(getDriverRideActionAvailability("driver_arriving")).toEqual({
      canStart: false,
      canComplete: false,
      canCancel: true,
    });
    expect(getDriverRideActionAvailability("passenger_boarded")).toEqual({
      canStart: true,
      canComplete: false,
      canCancel: true,
    });
    expect(getDriverRideActionAvailability("in_progress")).toEqual({
      canStart: false,
      canComplete: true,
      canCancel: false,
    });
  });

  it("canonicalizes deterministic aliases but fails closed for ambiguous ones", () => {
    expect(getDriverRideActionAvailability("passenger_on_board").canStart).toBe(true);
    expect(getDriverRideActionAvailability("driver_on_the_way")).toEqual({
      canStart: false,
      canComplete: false,
      canCancel: true,
    });
    expect(getDriverRideActionAvailability("driver_arrived")).toEqual({
      canStart: false,
      canComplete: false,
      canCancel: false,
    });
    expect(getDriverRideActionAvailability("cancelled")).toEqual({
      canStart: false,
      canComplete: false,
      canCancel: false,
    });
  });

  it("removes the two orphan legacy lifecycle implementations", () => {
    expect(
      existsSync(join(process.cwd(), "src/modules/mobility/utils/rideHelpers.ts")),
    ).toBe(false);
    expect(
      existsSync(
        join(
          process.cwd(),
          "src/modules/mobility/components/driver/DriverRideActions.tsx",
        ),
      ),
    ).toBe(false);
  });

  it("keeps formatting helpers free of lifecycle action authority", () => {
    expect(helpers).not.toContain("function canAcceptRide");
    expect(helpers).not.toContain("function canStartRide");
    expect(helpers).not.toContain("function canCompleteRide");
    expect(helpers).not.toContain("function canCancelRide");
    expect(facade).not.toContain("static canStartRide");
    expect(facade).not.toContain("static canCancelRide");
  });

  it("routes both active driver entry points through the canonical action adapter", () => {
    expect(ridesTab).toContain(
      'CanonicalDriverRidesList as DriverRidesList',
    );
    expect(ridesLayout).toContain(
      'CanonicalDriverRidesList as DriverRidesList',
    );
    expect(canonicalList).toContain("getDriverRideActionAvailability(ride.status)");
    expect(canonicalList).toContain("actions.canStart ? onStart : undefined");
    expect(canonicalList).toContain("actions.canComplete ? onComplete : undefined");
    expect(canonicalList).toContain("actions.canCancel ? onCancel : undefined");
  });
});
