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
});
