import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

function read(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

describe("Território Vivo navigation SSOT", () => {
  it("keeps one registry for the five global modes", () => {
    const registry = read(
      "src/core/navigation/territoryNavigationModes.ts",
    );

    for (const id of [
      '"today"',
      '"explore"',
      '"community"',
      '"activity"',
      '"account"',
    ]) {
      expect(registry).toContain(id);
    }

    expect(registry).toContain("buildTerritoryNavigationModes");
    expect(registry).toContain("isTerritoryNavigationModeActive");
  });

  it("keeps adaptive and legacy mobile renderers as consumers, not authorities", () => {
    const adaptive = read(
      "src/app/components/territory-vivo/TerritoryAdaptiveNavigation.tsx",
    );
    const bottom = read("src/core/navigation/BottomNav.tsx");

    for (const source of [adaptive, bottom]) {
      expect(source).toContain("buildTerritoryNavigationModes");
      expect(source).toContain("isTerritoryNavigationModeActive");
      expect(source).not.toContain('label: "Hoje"');
      expect(source).not.toContain('label: "Explorar"');
      expect(source).not.toContain('label: "Community"');
    }
  });
});
