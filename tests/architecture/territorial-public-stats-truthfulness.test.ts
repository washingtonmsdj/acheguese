import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = resolve(__dirname, "../..");
const read = (path: string) => readFileSync(resolve(ROOT, path), "utf8");

describe("territorial public stats truthfulness", () => {
  it("never estimates school counts from population", () => {
    const territoryStats = read(
      "src/core/territorial/hooks/useTerritoryStats.ts",
    );
    const landingStats = read(
      "src/core/landing/services/LandingFeaturedService.ts",
    );

    expect(territoryStats).not.toContain("/ 2000");
    expect(territoryStats).not.toContain("Math.floor");
    expect(territoryStats).not.toContain("schools:");
    expect(landingStats).toContain('"education_profiles"');
    expect(landingStats).toContain('.eq("institution_type", "school")');
    expect(landingStats).toContain('.eq("status", "published")');
  });

  it("does not reuse school count as bus-line count", () => {
    const landing = read(
      "src/core/routing/components/TerritorialLandingPage.tsx",
    );

    expect(landing).toContain("stats.schools ?? '—'");
    expect(landing).not.toContain("territoryStats?.schools");
    expect(landing).toContain(">Linhas</p>");
  });
});
