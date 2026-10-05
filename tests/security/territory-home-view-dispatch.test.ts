import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const territoryHomePage = readFileSync(
  "src/app/pages/TerritoryHomePage.tsx",
  "utf8",
);

describe("territory home portal view dispatch", () => {
  it("resolves active MVP portal views explicitly", () => {
    expect(territoryHomePage).toContain('value === MODULE_SLUGS.map');
    expect(territoryHomePage).toContain('value === MODULE_SLUGS.business');
    expect(territoryHomePage).toContain('value === MODULE_SLUGS.nearby');
    expect(territoryHomePage).toContain('value === MODULE_SLUGS.search');
    expect(territoryHomePage).not.toContain("views[value]");
    expect(territoryHomePage).not.toContain("Partial<Record<string, TerritoryPortalView>>");
  });
});
