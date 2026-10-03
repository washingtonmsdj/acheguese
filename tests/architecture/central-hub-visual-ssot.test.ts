import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

function read(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

describe("Central hub visual SSOT", () => {
  it("keeps the active Central hub on canonical territory visual tokens", () => {
    const hub = read("src/modules/central/pages/CentralHubPage.tsx");

    for (const legacyUtility of [
      "text-muted-foreground",
      "text-foreground",
      "bg-primary",
      "border-primary",
      "bg-card",
      "border-border",
    ]) {
      expect(hub).not.toContain(legacyUtility);
    }

    for (const territoryUtility of [
      "text-territory-ink",
      "text-territory-muted",
      "bg-territory-surface",
      "bg-territory-raised",
      "bg-territory-sun",
      "border-territory-border",
      "border-territory-brand",
      "text-territory-brand",
    ]) {
      expect(hub).toContain(territoryUtility);
    }
  });
});
