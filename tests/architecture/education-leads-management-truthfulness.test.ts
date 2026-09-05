import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();

describe("G6 Education leads management truthfulness", () => {
  it("paginates lead cards while keeping global stage counts", () => {
    const page = readFileSync(
      join(ROOT, "src/modules/business/education/pages/EducationLeadsPage.tsx"),
      "utf8",
    );
    const view = readFileSync(
      join(
        ROOT,
        "src/modules/business/education/components/EducationPipelineView.tsx",
      ),
      "utf8",
    );
    const service = readFileSync(
      join(
        ROOT,
        "src/modules/business/education/services/EducationService.ts",
      ),
      "utf8",
    );

    expect(page).toContain("const pageSize = 25");
    expect(page).toContain("Pagina {page} de {totalPages}");
    expect(page).toContain("statusCounts={summary?.byStatus}");
    expect(view).toContain("statusCounts?.[stage.status] ?? stageLeads.length");
    expect(service).toContain("queries.countLeadsByStatus(profileId)");
  });

  it("does not expose an inert manual lead CTA", () => {
    const page = readFileSync(
      join(ROOT, "src/modules/business/education/pages/EducationLeadsPage.tsx"),
      "utf8",
    );
    expect(page).not.toContain("Novo Lead");
  });
});
