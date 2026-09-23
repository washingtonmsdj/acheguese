import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

function read(path: string): string {
  return readFileSync(join(ROOT, path), "utf8");
}

describe("MVP private launch-scope boundaries", () => {
  it("keeps private Education preserved but outside the active Central graph", () => {
    const launchScope = read("src/app/config/launchScope.ts");
    const routes = read("src/app/routes/sections/CentralRoutes.tsx");
    const activeLazy = read("src/app/routes/activeCentralLazyImports.ts");
    const preservedLazy = read("src/app/routes/centralLazyImports.ts");

    expect(launchScope).toContain(
      'education: isProductModuleEnabled("education")',
    );

    for (const educationRoute of [
      'path="educacao"',
      'path="educacao/setup"',
      'path="educacao/programas"',
      'path="educacao/leads"',
      'path="educacao/eventos"',
      'path="educacao/analytics"',
      'path="educacao/planos"',
    ]) {
      expect(routes).not.toContain(educationRoute);
    }

    for (const owner of [
      "EducationDashboardPage",
      "EducationSetupPage",
      "EducationProgramsPage",
      "EducationLeadsPage",
      "EducationEventsPage",
      "EducationAnalyticsPage",
      "EducationPlansPage",
    ]) {
      expect(activeLazy).not.toContain(owner);
      expect(preservedLazy).toContain(owner);
    }

    expect(routes).toContain('path="*" element={<P.NotFound />}');
  });

  it("keeps Billing preserved but outside private navigation and active routes while paused", () => {
    const launchScope = read("src/app/config/launchScope.ts");
    const routes = read("src/app/routes/sections/CentralRoutes.tsx");
    const activeLazy = read("src/app/routes/activeCentralLazyImports.ts");
    const preservedLazy = read("src/app/routes/centralLazyImports.ts");
    const profileNavigation = read(
      "src/modules/profile/utils/profileNavigation.ts",
    );
    const profileSummary = read("src/modules/profile/sections/ResumoSection.tsx");

    expect(launchScope).toContain(
      'billing: isProductModuleEnabled("billing")',
    );
    expect(routes).not.toContain('path="planos"');
    expect(routes).not.toContain("BusinessPlansPage");
    expect(activeLazy).not.toContain("BusinessPlansPage");
    expect(preservedLazy).toContain("BusinessPlansPage");
    expect(profileNavigation).toContain('planos: "billing"');
    expect(profileSummary).toContain(
      'const showBilling = isLaunchSurfaceEnabled("billing")',
    );
    expect(profileSummary).toContain("{showBilling ? (");
  });

  it("keeps paused Services out of Central navigation and active routes", () => {
    const launchScope = read("src/app/config/launchScope.ts");
    const centralNavigation = read(
      "src/modules/central/components/centralNavigation.config.ts",
    );
    const centralRoutes = read("src/app/routes/sections/CentralRoutes.tsx");
    const activeLazy = read("src/app/routes/activeCentralLazyImports.ts");
    const preservedLazy = read("src/app/routes/centralLazyImports.ts");

    expect(launchScope).toContain(
      'services: isProductModuleEnabled("services")',
    );
    expect(centralNavigation).not.toContain("professional-home");
    expect(centralNavigation).not.toContain("professional");
    expect(centralRoutes).not.toContain('path="profissional"');
    expect(activeLazy).not.toContain("ProfessionalGuard");
    expect(preservedLazy).toContain("ProfessionalGuard");
  });
});
