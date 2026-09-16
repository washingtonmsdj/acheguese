import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(__dirname, "../..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("Mobility pricing facade SSOT", () => {
  it("does not re-export the removed hardcoded fare helper", () => {
    const facade = read("src/core/mobility/services/MobilityService.ts");
    const helpers = read("src/core/mobility/services/mobility.helpers.ts");

    expect(helpers).not.toContain("calculateEstimatedFare");
    expect(facade).not.toContain("calculateEstimatedFare");
  });

  it("keeps fare estimation owned by PricingService", () => {
    const pricing = read("src/core/pricing/services/PricingService.ts");
    const helpers = read("src/core/mobility/services/mobility.helpers.ts");

    expect(pricing).toContain("async calculateEstimate(");
    expect(pricing).toContain("async calculateQuickEstimate(");
    expect(helpers).not.toMatch(/baseFare\s*[=:+]/);
    expect(helpers).not.toMatch(/pricePerKm\s*[=:+]/);
    expect(helpers).not.toMatch(/perKmRate\s*[=:+]/);
  });
});
