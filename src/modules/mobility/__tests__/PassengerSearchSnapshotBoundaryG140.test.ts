import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("G140 passenger search snapshot boundary", () => {
  const rideReads = readProjectFile(
    "src/core/mobility/services/mobility.ride-read-queries.ts",
  );
  const page = readProjectFile(
    "src/modules/mobility/pages/BuscandoMotoristaPage.tsx",
  );
  const snapshot = readProjectFile(
    "src/core/mobility/services/RideSearchSnapshotReadModel.ts",
  );

  it("uses a dedicated bounded projection on the canonical ride query owner", () => {
    const start = rideReads.indexOf("export async function getRideWithAddresses(");
    const end = rideReads.indexOf("export async function getRideBasicInfo(", start);
    const method = rideReads.slice(start, end);

    expect(method).toContain("Promise<RideSearchSnapshotRow | null>");
    expect(method).toContain(".from<RideSearchSnapshotRow>(\"ride_requests\")");
    expect(method).toContain(".select(RIDE_SEARCH_SNAPSHOT_SELECT)");
    expect(method).not.toContain("*,");
    expect(method).not.toContain('select("*")');
  });

  it("keeps the passenger search page on the canonical bounded read owner", () => {
    expect(page).toContain(
      'from "@/core/mobility/services/mobility.ride-read-queries"',
    );
    expect(page).toContain("queryFn: () => getRideWithAddresses(rideId!)");
    expect(page).not.toContain("mobilityService.getRideWithAddresses");
    expect(page).not.toContain("type RideWithAddresses =");
  });

  it("limits the snapshot to route presentation, lifecycle and offered price", () => {
    for (const required of [
      "id,",
      "status,",
      "suggested_price,",
      "pickup_address:addresses!pickup_address_id",
      "dropoff_address:addresses!dropoff_address_id",
      "pickup_location:locations!pickup_location_id",
      "dropoff_location:locations!dropoff_location_id",
    ]) {
      expect(snapshot).toContain(required);
    }

    for (const forbidden of [
      "passenger_profile_id",
      "driver_profile_id",
      "recipient_name",
      "recipient_phone",
      "delivery_notes",
      "proof_of_delivery",
      "final_price",
      "observation",
      "payment_method",
    ]) {
      expect(snapshot).not.toContain(forbidden);
    }
  });
});
