import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

function read(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

describe("Category Business visual SSOT", () => {
  it("keeps the active public category listing on canonical territory tokens", () => {
    const source = read("src/core/business/pages/CategoryBusinessPage.tsx");

    for (const legacyUtility of [
      "bg-background",
      "bg-card",
      "bg-secondary",
      "border-border",
      "border-primary",
      "bg-primary",
      "text-primary",
      "text-primary-foreground",
      "text-foreground",
      "text-muted-foreground",
      "text-secondary-foreground",
      "focus:ring-primary",
      "bg-accent",
      "text-accent-foreground",
    ]) {
      expect(source, legacyUtility).not.toContain(legacyUtility);
    }

    for (const territoryUtility of [
      "bg-territory-canvas",
      "bg-territory-surface",
      "bg-territory-raised",
      "border-territory-border",
      "bg-territory-brand",
      "text-territory-brand",
      "text-territory-on-image",
      "text-territory-ink",
      "text-territory-muted",
      "text-territory-muted-strong",
      "focus:ring-territory-focus",
      "bg-territory-sun/90",
    ]) {
      expect(source, territoryUtility).toContain(territoryUtility);
    }
  });

  it("preserves semantic status styling instead of flattening it into territory identity", () => {
    const source = read("src/core/business/pages/CategoryBusinessPage.tsx");

    expect(source).toContain("bg-success/90");
    expect(source).toContain("bg-destructive/90");
    expect(source).toContain("bg-warning");
  });
});
