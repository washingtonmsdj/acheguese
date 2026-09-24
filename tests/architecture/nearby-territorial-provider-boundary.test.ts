import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("Nearby territorial provider boundary", () => {
  it("keeps Business territorial availability on the Nearby provider instead of the route capability", () => {
    const registry = read("src/core/nearby/providers/registry.ts");
    const layout = read("src/core/routing/components/TerritorialLayout.tsx");

    expect(registry).toContain("territoryModuleKey: ModuleKey.BUSINESS");
    expect(registry).toContain("getNearbyTerritoryModuleKey");
    expect(layout).toContain('getNearbyTerritoryModuleKey("business")');
    expect(layout).not.toContain("[MODULE_SLUGS.nearby]: ModuleKey.BUSINESS");
  });
});
