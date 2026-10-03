import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

function read(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

describe("Business modules section visual SSOT", () => {
  it("keeps the active Business profile workspace on canonical territory tokens", () => {
    const source = read(
      "src/core/profiles/components/hub/BusinessModulesSection.tsx",
    );

    for (const legacyUtility of [
      "border-border",
      "bg-background",
      "bg-card",
      "text-foreground",
      "text-muted-foreground",
      "bg-primary",
      "text-primary",
      "border-primary",
    ]) {
      expect(source, legacyUtility).not.toContain(legacyUtility);
    }

    for (const territoryUtility of [
      "border-territory-border",
      "bg-territory-surface",
      "bg-territory-raised",
      "bg-territory-sun",
      "text-territory-ink",
      "text-territory-muted",
    ]) {
      expect(source, territoryUtility).toContain(territoryUtility);
    }
  });
});
