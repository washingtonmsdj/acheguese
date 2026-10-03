import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

function read(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

describe("Central header visual SSOT", () => {
  it("projects the active Central header from territory semantics", () => {
    const header = read("src/modules/central/components/CentralHeader.tsx");

    for (const legacyUtility of [
      "border-border",
      "bg-card",
      "text-muted-foreground",
      "text-foreground",
      "bg-primary",
      "text-primary",
    ]) {
      expect(header).not.toContain(legacyUtility);
    }

    for (const territoryUtility of [
      "border-territory-border",
      "bg-territory-surface/80",
      "bg-territory-raised",
      "text-territory-ink",
      "text-territory-muted",
      "text-territory-brand",
    ]) {
      expect(header).toContain(territoryUtility);
    }
  });
});
