import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

function read(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

describe("Territory entry map group boundary", () => {
  it("resolves the launch Complexo through the territorial group owner", () => {
    const source = read("src/app/pages/TerritoryEntryPage.tsx");

    expect(source).toContain("territorialGroupService");
    expect(source).toContain("getGroupBySlugAndCity");
    expect(source).toContain("getGroupWithMembers");
    expect(source).toContain('return { kind: "group", group: fullGroup }');
    expect(source).toContain("resolvedTerritory={previewTerritory}");
  });

  it("passes the resolved group to the polygon owner and fits the map to its bounds", () => {
    const source = read(
      "src/app/components/territory-vivo/TerritoryEntryMap.tsx",
    );

    expect(source).toContain("resolvedTerritory ??");
    expect(source).toContain("useTerritoryPolygon(resolved)");
    expect(source).toContain("territoryPolygons={entryPolygons}");
    expect(source).toContain("fitTerritoryBounds={entryPolygons.length > 0}");
    expect(source).toContain("lineWidth: 4");
  });
});
