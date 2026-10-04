import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const JOBS_SURFACES = [
  "src/modules/classifieds/jobs/pages/VagasPublicPage.tsx",
  "src/modules/classifieds/jobs/pages/VagasPublicLayout.tsx",
] as const;

const read = (relativePath: string) =>
  fs.readFileSync(path.join(ROOT, relativePath), "utf8");

describe("Jobs territory boundary visual SSOT", () => {
  it("uses territorial tokens for the public shell and active-location projection", () => {
    const source = JOBS_SURFACES.map(read).join("\n");

    for (const token of [
      "territory-canvas",
      "territory-brand",
      "territory-border",
      "territory-surface",
      "territory-raised",
      "territory-ink",
      "territory-muted",
    ]) {
      expect(source, `missing ${token}`).toContain(token);
    }
  });

  it("does not regress those surfaces to generic theme primitives", () => {
    for (const relativePath of JOBS_SURFACES) {
      const source = read(relativePath);

      for (const legacyToken of [
        "border-primary/25",
        "bg-primary/5",
        "text-primary/80",
        "bg-background",
        "text-foreground",
        "text-muted-foreground",
      ]) {
        expect(source, `${relativePath}: ${legacyToken}`).not.toContain(legacyToken);
      }
    }
  });
});
