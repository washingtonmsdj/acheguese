import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();

describe("G6 Education lead pipeline write boundary", () => {
  it("enforces transitions in the canonical write model, not only the UI", () => {
    const mutations = readFileSync(
      join(ROOT, "src/core/education/services/education.mutations.ts"),
      "utf8",
    );
    expect(mutations).toContain("isAllowedLeadTransition");
    expect(mutations).toContain("Transicao de lead invalida");
    expect(mutations).toContain(".select('status')");
  });

  it("does not render advance actions for terminal lead statuses", () => {
    const view = readFileSync(
      join(
        ROOT,
        "src/modules/business/education/components/EducationPipelineView.tsx",
      ),
      "utf8",
    );
    expect(view).toContain("lead.status !== 'enrolled'");
    expect(view).toContain("lead.status !== 'lost'");
  });
});
