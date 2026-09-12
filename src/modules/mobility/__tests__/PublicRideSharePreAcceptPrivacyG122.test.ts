import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("G122 public ride-share pre-accept privacy", () => {
  const service = readProjectFile(
    "src/core/safety/services/SafetyRideShareService.ts",
  );
  const publicPage = readProjectFile(
    "src/modules/mobility/pages/TrackRidePage.tsx",
  );
  const pendingSpec = readProjectFile(
    "docs/09-reference/migrations-pending/g122-public-ride-share-preaccept-privacy.md",
  );

  it("redacts proposed-driver operational data before accepted lifecycle", () => {
    expect(service).toContain("isDriverOwnedOpenRideStatus");
    expect(service).toContain("const canExposeDriverOperationalData");
    expect(service).toContain("driverName: canExposeDriverOperationalData");
    expect(service).toContain("vehicleModel: canExposeDriverOperationalData");
    expect(service).toContain("vehiclePlate: canExposeDriverOperationalData");
    expect(service).toContain("canExposeDriverOperationalData &&");
  });

  it("does not present driver_assigned as active public tracking", () => {
    expect(publicPage).toContain("isDriverOwnedOpenRideStatus(data.status)");
    expect(publicPage).toContain("isPreAcceptRideStatus(data.status)");
    expect(publicPage).toContain("status === RIDE_STATE.DRIVER_ASSIGNED");
    expect(publicPage).toContain("aguardando confirmação");
    expect(publicPage).not.toContain("const activeStatuses");
    expect(publicPage).not.toContain('RIDE_STATUS.DRIVER_ASSIGNED');
  });

  it("retires the orphan generic driver tracking map", () => {
    expect(
      existsSync(
        resolve(
          process.cwd(),
          "src/modules/mobility/components/map/LiveTrackingMap.tsx",
        ),
      ),
    ).toBe(false);
  });

  it("keeps the unresolved server-side capability leak fail-closed and explicit", () => {
    expect(pendingSpec).toContain("driver_assigned");
    expect(pendingSpec).toContain("Connection terminated due to connection timeout");
    expect(pendingSpec).toContain("supabase migration new");
    expect(pendingSpec).toContain("SERVER FIX PENDING");
    expect(pendingSpec).not.toContain("Status: **APLICADO**");
  });
});
