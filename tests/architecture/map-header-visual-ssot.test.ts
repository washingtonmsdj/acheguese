import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

function read(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

describe("Map header visual SSOT", () => {
  it("projects MvpMapHeader from canonical territory utilities", () => {
    const page = read("src/core/maps/pages/MapaPageV4.tsx");
    const start = page.indexOf("function MvpMapHeader");
    const end = page.indexOf("type MapSortMode", start);
    expect(start).toBeGreaterThanOrEqual(0);
    expect(end).toBeGreaterThan(start);
    const header = page.slice(start, end);

    for (const legacyUtility of [
      "border-border",
      "bg-card",
      "text-primary",
      "text-foreground",
      "text-muted-foreground",
      "hover:bg-muted",
    ]) {
      expect(header).not.toContain(legacyUtility);
    }

    for (const territoryUtility of [
      "border-territory-border",
      "bg-territory-surface",
      "text-territory-brand",
      "text-territory-ink",
      "text-territory-muted",
      "hover:bg-territory-raised",
    ]) {
      expect(header).toContain(territoryUtility);
    }
  });
});
