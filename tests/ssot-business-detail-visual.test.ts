import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const PAGE = "src/app/pages/EmpresaDetailLandingPage.tsx";
const read = (relative: string) => fs.readFileSync(path.join(ROOT, relative), "utf8");

const LEGACY_VISUAL_UTILITIES = [
  "bg-primary",
  "text-primary",
  "border-primary",
  "bg-card",
  "border-border",
  "text-foreground",
  "text-muted-foreground",
  "bg-background",
] as const;

describe("public Business detail visual SSOT", () => {
  it("keeps loading and missing-business states free of generic theme primitives", () => {
    const source = read(PAGE);

    for (const legacy of LEGACY_VISUAL_UTILITIES) {
      expect(source, `${PAGE} must not reintroduce ${legacy}`).not.toContain(legacy);
    }
  });

  it("projects public fallback states from canonical territory tokens", () => {
    const source = read(PAGE);

    expect(source).toContain("bg-territory-canvas");
    expect(source).toContain("bg-territory-surface/95");
    expect(source).toContain("border-territory-border");
    expect(source).toContain("text-territory-muted");
    expect(source).toContain("text-territory-ink");
    expect(source).toContain("bg-territory-sun hover:bg-territory-sun/90 text-territory-ink");
  });
});
