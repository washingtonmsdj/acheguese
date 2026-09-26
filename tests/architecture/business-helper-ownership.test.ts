import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = resolve(__dirname, "../..");
const read = (path: string) => readFileSync(resolve(ROOT, path), "utf8");

describe("Business helper ownership", () => {
  it("does not keep parallel helper owners", () => {
    for (const retiredPath of [
      "src/core/business/services/BusinessCanonicalAdapter.ts",
      "src/core/business/services/business.helpers.ts",
      "src/core/business/utils/businessHelpers.ts",
    ]) {
      expect(existsSync(resolve(ROOT, retiredPath))).toBe(false);
    }
  });

  it("keeps BusinessService free of helper facades", () => {
    const service = read("src/core/business/services/BusinessService.ts");
    const barrel = read("src/core/business/index.ts");

    expect(service).not.toContain("BusinessHelpers");
    expect(service).not.toContain("./business.helpers");
    expect(service).not.toContain("isBusinessMigrated");
    expect(service).not.toContain("getCoordinates");
    expect(barrel).not.toContain("BusinessCanonicalAdapter");
    expect(barrel).not.toContain("isBusinessMigrated");
  });

  it("derives physical business coordinates only from Address", () => {
    const coordinates = read(
      "src/core/business/utils/physicalBusinessCoordinates.ts",
    );
    const addressCard = read(
      "src/modules/business/company/components/info/AddressCard.tsx",
    );

    expect(coordinates).toContain("business.address?.latitude");
    expect(coordinates).toContain("business.address?.longitude");
    expect(coordinates).not.toContain("canonical_lat");
    expect(coordinates).not.toContain("canonical_lng");
    expect(coordinates).not.toContain("metadata");
    expect(coordinates).not.toContain("business.latitude");
    expect(coordinates).not.toContain("business.longitude");

    expect(addressCard).toContain("getPhysicalBusinessCoordinates");
    expect(addressCard).not.toContain("business.helpers");
  });

  it("persists physical coordinates through canonical Address resolution and never business_data", () => {
    const mutations = read("src/core/business/services/business.mutations.ts");
    const resolution = read(
      "src/core/business/services/business.address-resolution.ts",
    );
    const queries = read("src/core/business/services/business.queries.ts");

    expect(mutations).toContain("resolveBusinessAddressForPersistence");
    expect(mutations).toContain("geocoding_source");
    expect(mutations).toContain("geocoding_confidence");
    expect(resolution).toContain("locationGeocodingService.geocode");
    expect(resolution).toContain(
      "BUSINESS_ADDRESS_MIN_GEOCODING_CONFIDENCE = 0.7",
    );
    expect(resolution).toContain("selectedTerritoryMatches");
    expect(resolution).not.toContain("canonical_lat");
    expect(resolution).not.toContain("canonical_lng");
    expect(resolution).not.toContain("location_center_fallback");
    expect(queries).not.toContain(
      "address_id,\n  latitude,\n  longitude,\n  status",
    );
    expect(queries).toContain("address:addresses!address_id(");
  });
});
