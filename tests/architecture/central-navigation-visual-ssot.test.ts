import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

function read(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

describe("Central navigation visual SSOT", () => {
  it("projects the active Central sidebar from territory semantics", () => {
    const navigation = read(
      "src/modules/central/components/CentralNavigation.tsx",
    );

    for (const legacyUtility of [
      "bg-primary",
      "text-primary",
      "text-primary-foreground",
      "text-foreground",
      "text-muted-foreground",
      "border-primary",
      "border-sidebar-border",
      "bg-sidebar-accent",
    ]) {
      expect(navigation).not.toContain(legacyUtility);
    }

    for (const territoryUtility of [
      "bg-territory-surface",
      "bg-territory-sun",
      "bg-territory-brand/10",
      "bg-territory-raised",
      "border-territory-border",
      "border-territory-brand/30",
      "text-territory-ink",
      "text-territory-muted",
      "text-territory-brand",
    ]) {
      expect(navigation).toContain(territoryUtility);
    }
  });
});
