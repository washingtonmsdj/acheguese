import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const ALERT_CARD_PATH =
  "src/core/community/alerts/components/AlertCard.tsx";

const read = (relativePath: string) =>
  fs.readFileSync(path.join(ROOT, relativePath), "utf8");

describe("Community alert visual SSOT", () => {
  it("projects alert states through territorial semantic tokens", () => {
    const source = read(ALERT_CARD_PATH);

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
    const source = read(ALERT_CARD_PATH);

    expect(source).not.toMatch(
      /(?:bg|border|text)-(?:red|orange|amber|yellow|green|gray|slate|zinc|neutral|stone)-\d{2,3}/,
    );
    expect(source).not.toContain("bg-card");
    expect(source).not.toContain("text-muted-foreground");
    expect(source).not.toContain("bg-muted");
  });
});
