import { existsSync, readFileSync } from "node:fs";
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

    const educationOwners = [
      ["EducationDashboardPage", "src/modules/business/education/pages/EducationDashboardPage.tsx"],
      ["EducationSetupPage", "src/modules/business/education/pages/EducationSetupPage.tsx"],
      ["EducationProgramsPage", "src/modules/business/education/pages/EducationProgramsPage.tsx"],
      ["EducationLeadsPage", "src/modules/business/education/pages/EducationLeadsPage.tsx"],
      ["EducationEventsPage", "src/modules/business/education/pages/EducationEventsPage.tsx"],
      ["EducationAnalyticsPage", "src/modules/business/education/pages/EducationAnalyticsPage.tsx"],
      ["EducationPlansPage", "src/modules/business/education/pages/EducationPlansPage.tsx"],
    ] as const;
    for (const [owner, ownerPath] of educationOwners) {
      expect(activeLazy).not.toContain(owner);
      expect(existsSync(join(ROOT, ownerPath))).toBe(true);
    }

    expect(routes).toContain('path="*" element={<P.NotFound />}');
  });

  it("keeps Billing preserved but outside private navigation and active routes while paused", () => {
    const launchScope = read("src/app/config/launchScope.ts");
    const routes = read("src/app/routes/sections/CentralRoutes.tsx");
    const activeLazy = read("src/app/routes/activeCentralLazyImports.ts");
    const profileNavigation = read(
      "src/modules/profile/utils/profileNavigation.ts",
    );
    const profileSummary = read("src/modules/profile/sections/ResumoSection.tsx");
    const businessHub = read(
      "src/core/profiles/components/hub/BusinessModulesSection.tsx",
    );

    expect(launchScope).toContain(
      'billing: isProductModuleEnabled("billing")',
    );
    expect(routes).not.toContain('path="planos"');
    expect(routes).not.toContain("BusinessPlansPage");
    expect(activeLazy).not.toContain("BusinessPlansPage");
    expect(
      existsSync(join(ROOT, "src/modules/business/dashboard/pages/BusinessPlansPage.tsx")),
    ).toBe(true);
    expect(profileNavigation).toContain('planos: "billing"');
    expect(profileNavigation).toContain("isProductModuleEnabled(productModule)");
    expect(profileNavigation).not.toContain("isLaunchSurfaceEnabled");
    expect(profileSummary).toContain(
      'const showBilling = isProductModuleEnabled("billing")',
    );
    expect(profileSummary).not.toContain("isLaunchSurfaceEnabled");
    expect(profileSummary).toContain("{showBilling ? (");
    expect(profileSummary).not.toContain("appUrls.services.list");
    expect(profileSummary).not.toContain("appUrls.community.feed");
    expect(profileSummary).not.toContain("operations.services");
    expect(profileSummary).not.toContain("operations.classifieds");
    expect(profileSummary).not.toContain("Posts publicados");
    expect(businessHub).not.toContain("business.gastronomy");
    expect(businessHub).not.toContain('isProductModuleEnabled("mobility")');
    expect(businessHub).not.toContain('isProductModuleEnabled("publicAnalytics")');
    expect(businessHub).not.toContain("Ativar gastronomia");
    expect(businessHub).not.toContain(">Gastronomia<");
    expect(businessHub).not.toContain(">Delivery<");
  });

  it("keeps paused Services out of Central navigation and active routes", () => {
    const launchScope = read("src/app/config/launchScope.ts");
    const centralNavigation = read(
      "src/modules/central/components/centralNavigation.config.ts",
    );
    const centralRoutes = read("src/app/routes/sections/CentralRoutes.tsx");
    const activeLazy = read("src/app/routes/activeCentralLazyImports.ts");

    expect(launchScope).toContain(
      'services: isProductModuleEnabled("services")',
    );
    expect(centralNavigation).not.toContain("professional-home");
    expect(centralNavigation).not.toContain("professional");
    expect(centralRoutes).not.toContain('path="profissional"');
    expect(activeLazy).not.toContain("ProfessionalGuard");
    expect(
      existsSync(join(ROOT, "src/modules/central/guards/ProfessionalGuard.tsx")),
    ).toBe(true);
    expect(
      existsSync(join(ROOT, "src/modules/central/pages/CentralProfissionalPage.tsx")),
    ).toBe(true);
  });
});
