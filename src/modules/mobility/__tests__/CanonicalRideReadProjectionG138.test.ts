import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("G138 canonical ride read projection", () => {
  const queries = readProjectFile(
    "src/core/mobility/services/mobility.queries.ts",
  );
  const readModel = readProjectFile(
    "src/core/mobility/services/RideRequestReadModel.ts",
  );
  const rideService = readProjectFile(
    "src/core/mobility/services/RideService.ts",
  );
  const rideSearch = readProjectFile(
    "src/modules/mobility/hooks/useRideSearch.ts",
  );

  it("removes select star from canonical mobility ride queries", () => {
    expect(queries).not.toContain('select("*")');
    expect(queries).toContain("RIDE_REQUEST_READ_SELECT");
    expect(queries).toContain("toRideRequestReadModel");
  });

  it("keeps the shared read projection free of sensitive delivery payloads", () => {
    expect(readModel).toContain('"passenger_profile_id"');
    expect(readModel).toContain('"driver_profile_id"');
    expect(readModel).toContain('"status"');
    expect(readModel).toContain('"origin"');
    expect(readModel).toContain('"destination"');

    for (const forbidden of [
      '"recipient_phone"',
      '"recipient_name"',
      '"delivery_notes"',
      '"proof_of_delivery"',
      '"failed_delivery_metadata"',
      '"package_description"',
    ]) {
      expect(readModel).not.toContain(forbidden);
    }
  });

  it("returns typed passenger and active rides without facade casts", () => {
    expect(rideService).toContain("return getRidesByPassenger(passengerId)");
    expect(rideService).toContain("return getActiveRide(userId)");
    expect(rideService).not.toContain(
      "getRidesByPassenger(passengerId);\n    return rides as RideRequest[]",
    );
    expect(rideService).not.toContain(
      "getActiveRide(userId);\n    return (ride as RideRequest",
    );
  });

  it("lets ride search consume the typed canonical lookup directly", () => {
    expect(rideSearch).toContain("const ride = await getRideById(rideId)");
    expect(rideSearch).not.toContain("interface RideStatusRow");
    expect(rideSearch).not.toContain("as RideStatusRow");
  });
});
