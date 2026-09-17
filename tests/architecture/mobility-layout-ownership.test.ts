import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const retiredMobilityLayoutFacades = [
  "src/modules/mobility/components/driver/DriverAvailabilityLayout.tsx",
  "src/modules/mobility/components/driver/DriverDeliveriesLayout.tsx",
  "src/modules/mobility/components/driver/DriverEarningsLayout.tsx",
  "src/modules/mobility/components/driver/DriverProfileLayout.tsx",
  "src/modules/mobility/components/driver/DriverRidesLayout.tsx",
] as const;

const canonicalMobilityLayouts = [
  "src/core/mobility/components/driver/DriverAvailabilityLayout.tsx",
  "src/core/mobility/components/driver/DriverDeliveriesLayout.tsx",
  "src/core/mobility/components/driver/DriverEarningsLayout.tsx",
  "src/core/mobility/components/driver/DriverProfileLayout.tsx",
  "src/core/mobility/components/driver/DriverRidesLayout.tsx",
] as const;

describe("shared Mobility layout ownership", () => {
  it("keeps the reusable driver layouts only under core/mobility", () => {
    for (const path of retiredMobilityLayoutFacades) {
      expect(existsSync(path), `${path} is a retired facade`).toBe(false);
    }
    for (const path of canonicalMobilityLayouts) {
      expect(existsSync(path), `${path} is the canonical owner`).toBe(true);
    }
  });

  it("keeps Central consumers on the canonical owner", () => {
    const centralPage = readFileSync(
      "src/modules/central/pages/motoboy/CentralMotoboyEntregasPage.tsx",
      "utf8",
    );
    expect(centralPage).toContain("@/core/mobility/components/driver");
    expect(centralPage).not.toContain("@/modules/mobility/components/driver");
  });
});
