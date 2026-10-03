import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

function read(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

describe("Map explorer visual SSOT", () => {
  it("projects the active territorial explorer from canonical territory semantics", () => {
    const explorer = read("src/core/maps/pages/MapaTerritorialExplorer.css");

    expect(explorer).not.toMatch(
      /var\(--(?:primary|primary-foreground|background|card|border|foreground|muted-foreground)\)/,
    );

    for (const territoryToken of [
      "var(--territory-border)",
      "var(--territory-surface)",
      "var(--territory-surface-raised)",
      "var(--territory-ink)",
      "var(--territory-muted)",
      "var(--territory-brand)",
      "var(--territory-sun)",
    ]) {
      expect(explorer).toContain(territoryToken);
    }

    expect(explorer).toContain(
      ".map-selection .map-selection-actions > a { background: hsl(var(--territory-sun)); color: hsl(var(--territory-ink)); }",
    );
    expect(explorer).toContain(".map-result-verified { color: hsl(var(--success)); }");
  });
});
