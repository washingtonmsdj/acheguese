import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const ALERT_SURFACES = [
  "src/core/community/alerts/components/AlertCard.tsx",
  "src/core/community/alerts/components/AlertCardSkeleton.tsx",
  "src/core/community/alerts/components/AlertFeedSection.tsx",
  "src/core/community/alerts/components/CreateAlertModal.tsx",
] as const;

const read = (relativePath: string) =>
  fs.readFileSync(path.join(ROOT, relativePath), "utf8");

describe("Community alert visual SSOT", () => {
  it("projects alert states through territorial semantic tokens", () => {
    const source = ALERT_SURFACES.map(read).join("\n");

    for (const token of [
      "territory-error",
      "territory-warning",
      "territory-success",
      "territory-surface",
      "territory-raised",
      "territory-border",
      "territory-ink",
      "territory-muted",
      "territory-brand",
    ]) {
      expect(source, `missing semantic token ${token}`).toContain(token);
    }
  });

  it("does not regress to generic Tailwind status palettes", () => {
    for (const relativePath of ALERT_SURFACES) {
      const source = read(relativePath);

      expect(source, relativePath).not.toMatch(
        /(?:bg|border|text)-(?:red|orange|amber|yellow|green|gray|slate|zinc|neutral|stone)-\d{2,3}/,
      );
      for (const legacyToken of [
        "bg-card",
        "bg-muted",
        "text-muted-foreground",
        "text-destructive",
        "bg-destructive",
        "border-border",
        "border-input",
        "bg-background",
      ]) {
        expect(source, `${relativePath}: ${legacyToken}`).not.toContain(legacyToken);
      }
    }
  });
});
