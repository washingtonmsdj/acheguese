import { describe, expect, it } from "vitest";
import { AddressPrivacyGuard } from "../../src/core/address/services/AddressPrivacyGuard";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Address } from "../../src/core/address/types";

const address: Address = {
  id: "00000000-0000-4000-8000-000000000001",
  location_id: "00000000-0000-4000-8000-000000000002",
  address_type: "exact",
  precision: "street",
  street: "EXEMPLO PRIVADO",
  number: "123",
  complement: "APARTAMENTO PRIVADO",
  postal_code: "00000-000",
  owner_user_id: "00000000-0000-4000-8000-000000000003",
  metadata: {},
  latitude: -12.99,
  longitude: -38.50,
  geocoded_at: null,
  geocoding_source: null,
  geocoding_confidence: null,
  verification_status: "pending",
  verified_reason: null,
  is_verified: false,
  verified_at: null,
  verified_by: null,
  created_at: "2026-10-08T00:00:00Z",
  updated_at: "2026-10-08T00:00:00Z",
};

describe("Address verified-only public projection", () => {
  it.each([
    { verified: false, status: "pending" as const },
    { verified: false, status: "verified" as const },
    { verified: true, status: "pending" as const },
    { verified: true, status: "rejected" as const },
  ])("hides coordinates unless both verification signals agree: %o", ({ verified, status }) => {
    const value = AddressPrivacyGuard.toPublic({
      ...address,
      is_verified: verified,
      verification_status: status,
    });
    expect(value.is_verified).toBe(false);
    expect(value.latitude).toBeNull();
    expect(value.longitude).toBeNull();
    expect(JSON.stringify(value)).not.toContain("EXEMPLO PRIVADO");
    expect(value).not.toHaveProperty("street");
    expect(value).not.toHaveProperty("number");
    expect(value).not.toHaveProperty("postal_code");
    expect(value).not.toHaveProperty("owner_user_id");
  });

  it("publishes only safe fields for a fully verified address", () => {
    const record = {
      ...address,
      is_verified: true,
      verification_status: "verified" as const,
    };
    const pub = AddressPrivacyGuard.toPublic(record);
    expect(pub.is_verified).toBe(true);
    expect(pub.latitude).toBe(record.latitude);
    expect(pub.longitude).toBe(record.longitude);
    expect(Object.keys(pub).sort()).toEqual([
      "address_type", "id", "is_verified", "latitude", "location_id",
      "longitude", "precision", "verification_status",
    ].sort());
  });

  it("keeps the residential helper delegated to the canonical privacy guard", () => {
    const source = readFileSync(
      join(process.cwd(), "src/core/address/services/ResidentAddressService.ts"),
      "utf8",
    );
    expect(source).toContain("return AddressPrivacyGuard.toPublic(address);");
    expect(source).not.toContain("latitude: address.is_verified ?");
  });
});
