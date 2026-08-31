import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(__dirname, "../..");
const source = readFileSync(
  resolve(repoRoot, "src/core/business/services/business.queries.ts"),
  "utf8",
);

describe("business canonical relation projection", () => {
  it("keeps heavy address/location rows out of business list and detail reads", () => {
    expect(source).toContain("BUSINESS_CANONICAL_RELATIONS_SELECT");

    for (const field of [
      "street",
      "number",
      "complement",
      "postal_code",
      "latitude",
      "longitude",
      "name",
      "full_name",
      "geographic_path",
      "canonical_lat",
      "canonical_lng",
    ]) {
      expect(source).toContain(field);
    }

    expect(source).not.toContain("address:addresses!address_id(*)");
    expect(source).not.toContain("location:locations!location_id(*)");
    expect(source).not.toContain("boundary,");
  });
});
