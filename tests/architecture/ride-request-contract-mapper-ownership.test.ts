import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = resolve(__dirname, "../..");
const read = (path: string) => readFileSync(resolve(ROOT, path), "utf8");

describe("Ride request contract mapper ownership", () => {
  it("retires the generic canonical adapter", () => {
    expect(
      existsSync(
        resolve(
          ROOT,
          "src/core/mobility/services/RideCanonicalAdapter.ts",
        ),
      ),
    ).toBe(false);

    expect(
      existsSync(
        resolve(
          ROOT,
          "src/core/mobility/services/RideRequestContractMapper.ts",
        ),
      ),
    ).toBe(true);
  });

  it("keeps only the read-model contract mapping responsibility", () => {
    const mapper = read(
      "src/core/mobility/services/RideRequestContractMapper.ts",
    );

    expect(mapper).toContain("export function toRideRequestContract");
    expect(mapper).toContain("toCanonicalRideState");
    expect(mapper).toContain("LEGACY_UNRESOLVED_OPEN_RIDE_STATUSES");
    expect(mapper).toContain("LEGACY_CLOSED_RIDE_STATUSES");

    for (const retiredHelper of [
      "isRideMigrated",
      "hasPickupAddress",
      "hasDropoffAddress",
      "getFormattedPickupAddress",
      "getFormattedDropoffAddress",
      "getPickupCoordinates",
      "getDropoffCoordinates",
      "getPickupTerritory",
      "getDropoffTerritory",
      "getPickupTerritoryName",
      "getDropoffTerritoryName",
    ]) {
      expect(mapper).not.toContain(retiredHelper);
    }
  });

  it("does not publish the internal mapper through MobilityService", () => {
    const service = read("src/core/mobility/services/MobilityService.ts");
    const readModel = read(
      "src/core/mobility/services/RideRequestReadModel.ts",
    );
    const ssotCheck = read("tools/architecture/check-ssot-compliance.ts");

    expect(service).not.toContain("RideCanonicalAdapter");
    expect(service).not.toContain("RideRequestContractMapper");
    expect(readModel).toContain(
      'from "./RideRequestContractMapper"',
    );
    expect(readModel).not.toContain("as unknown as Tables");
    expect(ssotCheck).not.toContain("RideCanonicalAdapter.ts");
    expect(ssotCheck).not.toContain("RideRequestContractMapper.ts");
  });
});
