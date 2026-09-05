import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();

describe("G6 Education private/public launch separation", () => {
  it("keeps public Education routes paused", () => {
    const launchScope = readFileSync(
      join(ROOT, "src/app/config/launchScope.ts"),
      "utf8",
    );
    const publicLazy = readFileSync(
      join(ROOT, "src/app/routes/lazyImports.ts"),
      "utf8",
    );

    expect(launchScope).toContain("education: false");
    expect(publicLazy).toContain(
      'EducationExplorerPage = createLaunchPausedRoute("Educacao")',
    );
    expect(publicLazy).toContain(
      'EducationDetailPage = createLaunchPausedRoute("Educacao")',
    );
  });

  it("keeps authenticated Business management routable for certification", () => {
    const centralLazy = readFileSync(
      join(ROOT, "src/app/routes/centralLazyImports.ts"),
      "utf8",
    );
    const centralRoutes = readFileSync(
      join(ROOT, "src/app/routes/sections/CentralRoutes.tsx"),
      "utf8",
    );

    expect(centralLazy).toContain(
      'import("@/modules/business/education/pages/EducationSetupPage")',
    );
    expect(centralLazy).toContain(
      'import("@/modules/business/education/pages/EducationProgramsPage")',
    );
    expect(centralLazy).toContain(
      'import("@/modules/business/education/pages/EducationLeadsPage")',
    );
    expect(centralLazy).toContain(
      'import("@/modules/business/education/pages/EducationEventsPage")',
    );
    expect(centralRoutes).toContain(
      'path="educacao/setup" element={<P.EducationSetupPage />}',
    );
    expect(centralRoutes).not.toContain(
      'path="educacao/setup" element={launchElement("education"',
    );
  });
});
