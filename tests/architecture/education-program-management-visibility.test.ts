import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();

describe("G6 Education program management visibility", () => {
  it("keeps public program reads active-only by default", () => {
    const hook = readFileSync(
      join(
        ROOT,
        "src/modules/business/education/hooks/useEducationPrograms.ts",
      ),
      "utf8",
    );
    const publicDetail = readFileSync(
      join(
        ROOT,
        "src/modules/business/education/pages/EducationDetailPage.tsx",
      ),
      "utf8",
    );

    expect(hook).toContain("includeInactive = false");
    expect(hook).toContain(
      "const isActiveFilter = includeInactive ? undefined : true",
    );
    expect(publicDetail).toContain(
      "useEducationPrograms(profile?.id)",
    );
    expect(publicDetail).not.toContain("includeInactive: true");
  });

  it("keeps the management page able to see and reactivate inactive programs", () => {
    const management = readFileSync(
      join(
        ROOT,
        "src/modules/business/education/pages/EducationProgramsPage.tsx",
      ),
      "utf8",
    );

    expect(management).toContain("includeInactive: true");
    expect(management).toContain("!program.is_active");
    expect(management).toContain("isActive: formData.isActive");
  });
});
