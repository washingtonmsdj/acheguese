import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

function read(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

describe("Território Vivo navigation SSOT", () => {
  it("keeps one registry for the active territorial modes", () => {
    const registry = read(
      "src/core/navigation/territoryNavigationModes.ts",
    );

    for (const id of [
      '"home"',
      '"map"',
      '"business"',
      '"nearby"',
      '"search"',
      '"account"',
    ]) {
      expect(registry).toContain(id);
    }

    for (const retiredId of [
      '"today"',
      '"explore"',
      '"community"',
      '"activity"',
    ]) {
      expect(registry).not.toContain(retiredId);
    }

    expect(registry).toContain("buildTerritoryNavigationModes");
    expect(registry).toContain("isTerritoryNavigationModeActive");
  });

  it("keeps adaptive and core mobile renderers as consumers, not authorities", () => {
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

    expect(adaptive).not.toContain('label: "Publicar"');
    expect(adaptive).not.toContain('label: "Conversas"');
    expect(adaptive).not.toContain("mobileItems");
    expect(adaptive).toContain("navigationModes.map");
  });

  it("does not recreate the retired app BottomNav wrapper", () => {
    expect(
      fs.existsSync(
        path.join(
          ROOT,
          "src/app/components/BottomNav.tsx",
        ),
      ),
    ).toBe(false);

    const layout = read(
      "src/app/components/AppLayoutSidebar.tsx",
    );
    expect(layout).toContain(
      '@/core/navigation/BottomNav',
    );
    expect(layout).not.toContain('./BottomNav');
  });

  it("keeps TerritoryTopbar under shared owner without app facade", () => {
    expect(
      fs.existsSync(
        path.join(
          ROOT,
          "src/app/components/territory-vivo/TerritoryTopbar.tsx",
        ),
      ),
    ).toBe(false);

    const barrel = read(
      "src/app/components/territory-vivo/index.ts",
    );
    expect(barrel).toContain(
      '@/shared/components/territory-vivo/TerritoryTopbar',
    );
  });
});
