import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("G120 passenger tracking boundary", () => {
  const page = readProjectFile("src/modules/mobility/pages/PassageiroPage.tsx");

  it("removes page-local lifecycle status arrays", () => {
    expect(page).not.toContain("ACTIVE_RIDE_STATUSES");
    expect(page).not.toContain("SEARCHING_RIDE_STATUSES");
    expect(page).not.toContain("TRACKABLE_RIDE_STATUSES");
  });

  it("derives open and pre-accept presentation from lifecycle authorities", () => {
    expect(page).toContain("isOpenRideStatus(ride.status)");
    expect(page).toContain("isPreAcceptRideStatus(ride.status)");
  });

  it("only mounts tracking after driver-owned acceptance", () => {
    expect(page).toContain("isDriverOwnedOpenRideStatus(ride.status)");
    expect(page).toContain("{canTrackDriver && ride.driver_profile_id && (");
    expect(page).not.toContain("RIDE_STATUS.DRIVER_ASSIGNED");
  });
});
