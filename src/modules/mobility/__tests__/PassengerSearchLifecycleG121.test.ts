import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("G121 passenger search lifecycle", () => {
  const realtime = readProjectFile("src/core/mobility/hooks/useRideRealtime.ts");
  const searchHook = readProjectFile("src/modules/mobility/hooks/useRideSearch.ts");
  const searchStatus = readProjectFile(
    "src/modules/mobility/components/PassengerSearchStatus.tsx",
  );
  const searchPage = readProjectFile(
    "src/modules/mobility/pages/BuscandoMotoristaPage.tsx",
  );
  const sidebar = readProjectFile(
    "src/modules/mobility/components/MobilidadeRightSidebar.tsx",
  );
  const cancelDialog = readProjectFile(
    "src/modules/mobility/components/CancelRideConfirmDialog.tsx",
  );

  it("allows ride-scoped realtime without a fake passenger profile id", () => {
    expect(realtime).toContain("Boolean(rideId || userId)");
    expect(realtime).toContain("rideId\n      ? { rideId }");
    expect(searchHook).not.toContain("passengerProfileId");
    expect(searchStatus).not.toContain("passengerProfileId");
  });

  it("classifies passenger search from shared lifecycle authorities", () => {
    expect(searchHook).toContain("isPreAcceptRideStatus(status)");
    expect(searchHook).toContain("isDriverOwnedOpenRideStatus(status)");
    expect(searchHook).toContain("isCancelledRideStatus(status)");
    expect(searchHook).toContain("status === RIDE_STATE.DRIVER_ASSIGNED");
    expect(searchHook).toContain("status: 'driver_found'");
  });

  it("navigates the search page from realtime search status instead of local status arrays", () => {
    expect(searchPage).toContain("onStatusChange={handleSearchStatusChange}");
    expect(searchPage).toContain("status.status === 'driver_accepted'");
    expect(searchPage).toContain("setLiveRideStatus(status.rideState)");
    expect(searchPage).not.toContain("successStatuses");
    expect(searchPage).not.toContain("terminalStatuses");
    expect(searchPage).not.toContain("RIDE_STATUS.DRIVER_ASSIGNED");
  });

  it("keeps sidebar counts and operational rides on shared lifecycle classifiers", () => {
    expect(sidebar).toContain("isOpenRideStatus(ride.status)");
    expect(sidebar).toContain("isDriverOwnedOpenRideStatus(ride.status)");
    expect(sidebar).not.toContain("RIDE_STATUS.PENDING");
    expect(sidebar).not.toContain("RIDE_STATUS.DRIVER_ASSIGNED");
  });

  it("does not invent cancellation penalties in the client dialog", () => {
    expect(cancelDialog).toContain("isPreAcceptRideStatus(rideStatus)");
    expect(cancelDialog).toContain("isDriverOwnedOpenRideStatus(rideStatus)");
    expect(cancelDialog).toContain("getRideStatusLabel(rideStatus)");
    expect(cancelDialog).not.toContain("sem penalidades");
    expect(cancelDialog).not.toContain("pode afetar sua avaliação");
    expect(cancelDialog).not.toContain("pode resultar em penalidades");
  });
});
