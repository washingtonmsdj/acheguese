import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const PIPELINE_PATH =
  "src/modules/business/education/components/EducationPipelineView.tsx";

const read = (relativePath: string) =>
  fs.readFileSync(path.join(ROOT, relativePath), "utf8");

describe("Education pipeline visual SSOT", () => {
  it("uses territorial semantic tokens for pipeline stages and lead surfaces", () => {
    const source = read(PIPELINE_PATH);

    for (const token of [
      "territory-info",
      "territory-brand",
      "territory-warning",
      "territory-sun",
      "territory-success",
      "territory-error",
      "territory-surface",
      "territory-border",
      "territory-ink",
      "territory-muted",
    ]) {
      expect(source, `missing semantic token ${token}`).toContain(token);
    }
  });

  it("does not regress to generic Tailwind palette or white card hardcoding", () => {
    const source = read(PIPELINE_PATH);

    expect(source).not.toMatch(
      /(?:bg|border|text)-(?:blue|purple|orange|cyan|green|red|gray|slate|zinc|neutral|stone)-\d{2,3}/,
    );
    expect(source).not.toContain("bg-white");
    expect(source).not.toContain("border-white");
  });

  it("keeps presentation details out of Education status constants", () => {
    const source = read(PIPELINE_PATH);

    expect(source).toContain("EducationStatusBadge");
    expect(source).not.toContain("stage.color");
  });
});
