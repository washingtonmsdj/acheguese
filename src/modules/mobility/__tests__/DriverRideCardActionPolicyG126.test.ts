import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("G126 driver ride card action policy", () => {
  const card = readProjectFile(
    "src/core/mobility/components/driver/DriverRidesList.tsx",
  );

  it("uses the canonical driver action policy instead of local status arrays", () => {
    expect(card).toContain("getDriverRideActionAvailability(ride.status)");
    expect(card).toContain("const canStartRide = actions.canStart");
    expect(card).toContain("const canCompleteRide = actions.canComplete");
    expect(card).toContain("const canCancelRide = actions.canCancel");
    expect(card).not.toContain("canStartStatuses");
    expect(card).not.toContain("canCancelStatuses");
  });

  it("does not duplicate acceptance authorization through session/profile lookups", () => {
    expect(card).not.toContain("getProfileByType(");
    expect(card).not.toContain("getDriverVerificationStatus(");
    expect(card).not.toContain("subscription_active");
    expect(card).not.toContain("driver.is_online");
  });

  it("keeps action callbacks as the execution boundary", () => {
    expect(card).toContain("await actionFn(rideId, ride)");
    expect(card).toContain("canStartRide && onStart");
    expect(card).toContain("canCompleteRide && onComplete");
    expect(card).toContain("canCancelRide && onCancel");
  });
});
