import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const PAGE_PATH = "src/app/pages/BuscarPage.tsx";

function read(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

describe("assisted search territory visual SSOT", () => {
  it("projects the assisted search shell from canonical territory tokens", () => {
    const page = read(PAGE_PATH);

    for (const token of [
      "bg-territory-canvas",
      "text-territory-ink",
      "text-territory-muted",
    ]) {
      expect(page).toContain(token);
    }

    for (const legacyUtility of [
      "bg-background",
      "text-muted-foreground",
    ]) {
      expect(page).not.toContain(legacyUtility);
    }
  });

  it("preserves assisted-search territory and AI contracts", () => {
    const page = read(PAGE_PATH);

    expect(page).toContain("getActiveAISearchIntentTypes");
    expect(page).toContain("useModuleTerritoryFilter");
    expect(page).toContain("useUserTerritory");
    expect(page).toContain("useResolveTerritoryFromUrl");
    expect(page).toContain("AISearchBox");
    expect(page).toContain("AISearchResults");
    expect(page).toContain("allowedIntentTypes: activeAISearchIntentTypes");
    expect(page).toContain("territoryFilter");
    expect(page).toContain("coordinates: moduleTerritory.centerCoords");
  });
});
