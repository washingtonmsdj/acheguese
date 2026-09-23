import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();

describe("G6 Education private/public launch separation", () => {
  it("keeps public Education routes paused", () => {
    const launchScope = readFileSync(
      join(ROOT, "src/app/config/launchScope.ts"),
      "utf8",
    );
    const activeLazy = readFileSync(
      join(ROOT, "src/app/routes/activeLazyImports.ts"),
      "utf8",
    );

    expect(launchScope).toContain(
      'education: isProductModuleEnabled("education")',
    );
    expect(activeLazy).not.toContain("EducationExplorerPage");
    expect(activeLazy).not.toContain("EducationDetailPage");
    expect(
      existsSync(join(ROOT, "src/modules/business/education/pages/EducationExplorerPage.tsx")),
    ).toBe(true);
    expect(
      existsSync(join(ROOT, "src/modules/business/education/pages/EducationDetailPage.tsx")),
    ).toBe(true);
  });

  it("preserves authenticated Education owners outside the active Central graph", () => {
    const activeCentralLazy = readFileSync(
      join(ROOT, "src/app/routes/activeCentralLazyImports.ts"),
      "utf8",
    );
    const centralRoutes = readFileSync(
      join(ROOT, "src/app/routes/sections/CentralRoutes.tsx"),
      "utf8",
    );

    const preservedOwners = [
      ["EducationSetupPage", "src/modules/business/education/pages/EducationSetupPage.tsx"],
      ["EducationProgramsPage", "src/modules/business/education/pages/EducationProgramsPage.tsx"],
      ["EducationLeadsPage", "src/modules/business/education/pages/EducationLeadsPage.tsx"],
      ["EducationEventsPage", "src/modules/business/education/pages/EducationEventsPage.tsx"],
    ] as const;
    for (const [owner, ownerPath] of preservedOwners) {
      expect(existsSync(join(ROOT, ownerPath))).toBe(true);
      expect(activeCentralLazy).not.toContain(owner);
    }

    expect(centralRoutes).not.toContain('path="educacao/setup"');
    expect(centralRoutes).not.toContain("EducationSetupPage");
    expect(centralRoutes).toContain('path="*" element={<P.NotFound />}');
  });
});
