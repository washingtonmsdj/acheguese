import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("G119 passenger lifecycle hook", () => {
  const hook = readProjectFile("src/modules/mobility/hooks/useMobilidade.ts");

  it("removes local ride status arrays", () => {
    expect(hook).not.toContain("ACTIVE_RIDE_STATUSES");
    expect(hook).not.toContain("PENDING_RIDE_STATUSES");
    expect(hook).not.toContain("ONGOING_RIDE_STATUSES");
  });

  it("derives passenger ride groups from lifecycle authorities", () => {
    expect(hook).toContain("isOpenRideStatus(ride.status)");
    expect(hook).toContain("isPreAcceptRideStatus(ride.status)");
    expect(hook).toContain("isDriverOwnedOpenRideStatus(ride.status)");
  });

  it("clears stale active state when refetch or realtime reaches a closed ride", () => {
    expect(hook).toContain("setActiveRide(active)");
    expect(hook).toContain(
      "setActiveRide(isOpenRideStatus(nextRide.status) ? nextRide : null)",
    );
  });
});
