import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const PAGE_PATH = "src/modules/classifieds/jobs/pages/VagasPublicPage.tsx";

const read = () => fs.readFileSync(path.join(ROOT, PAGE_PATH), "utf8");

describe("Jobs territory boundary visual SSOT", () => {
  it("uses territorial tokens for the active-location projection", () => {
    const source = read();

    for (const token of [
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

  it("does not regress that boundary to generic theme primitives", () => {
    const source = read();

    for (const legacyToken of [
      "border-primary/25",
      "bg-primary/5",
      "text-primary/80",
      "text-foreground",
      "text-muted-foreground",
    ]) {
      expect(source, legacyToken).not.toContain(legacyToken);
    }
  });
});
