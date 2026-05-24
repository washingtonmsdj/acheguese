import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const forbiddenDirectUsages = [
  "src/core/routing/hooks/useResolveTerritoryFromUrl.ts",
  "src/core/routing/components/TerritorialLayout.tsx",
  "src/core/routing/components/CountryLandingPage.tsx",
  "src/core/routing/components/StateLandingPage.tsx",
  "src/core/landing/useNationalFeatured.ts",
  "src/app/features/landing/services/LandingService.ts",
  "src/core/community/components/CommunityRolloutGate.tsx",
];

describe("territory visibility boundaries", () => {
  it("keeps is_selector_active confined to selector and management flows", () => {
    for (const relativePath of forbiddenDirectUsages) {
      const absolutePath = resolve(process.cwd(), relativePath);
      if (!existsSync(absolutePath)) continue;
      const fileContents = readFileSync(absolutePath, "utf8");

      expect(fileContents).not.toMatch(/is_selector_active/);
    }
  });
});
