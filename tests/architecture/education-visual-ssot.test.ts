import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { PRODUCT_MODULE_REGISTRY } from "../../src/app/config/productModuleRegistry";

const ROOT = process.cwd();
const EDUCATION_VISUAL_OWNERS = [
  "src/modules/business/education/pages/explorerNicheChip.tsx",
  "src/modules/business/education/pages/EducationDetailStateViews.tsx",
  "src/modules/business/education/pages/EducationAnalyticsPage.tsx",
  "src/modules/business/education/pages/EducationDashboardPage.tsx",
  "src/modules/business/education/pages/EducationLeadsPage.tsx",
  "src/modules/business/education/pages/EducationProgramsPage.tsx",
  "src/modules/business/education/pages/EducationEventsPage.tsx",
  "src/modules/business/education/pages/EducationPlansPage.tsx",
  "src/modules/business/education/pages/EducationSetupControls.tsx",
  "src/modules/business/education/pages/EducationSetupSections.tsx",
  "src/modules/business/education/components/analytics/EducationAnalyticsOverviewCard.tsx",
  "src/modules/business/education/components/analytics/EducationAnalyticsConversionCard.tsx",
  "src/modules/business/education/components/EducationLeadForm.tsx",
  "src/modules/business/education/components/EducationAdminReadError.tsx",
  "src/modules/business/education/niches/components/EducationUpgradeBanner.tsx",
] as const;

const LEGACY_VISUAL_TOKENS = [
  "bg-background",
  "bg-card",
  "text-foreground",
  "text-muted-foreground",
  "text-primary",
  "bg-primary",
  "border-input",
  "border-destructive",
  "bg-destructive",
  "text-destructive",
  "ring-ring",
  "ring-offset-background",
  "text-gray-",
  "bg-gray-",
  "border-gray-",
  "text-blue-",
  "bg-blue-",
  "border-blue-",
  "text-green-",
  "bg-green-",
  "text-orange-",
  "bg-orange-",
  "text-purple-",
  "bg-purple-",
  "text-cyan-",
  "bg-cyan-",
  "text-red-",
  "bg-red-",
  "border-red-",
  "text-amber-",
  "bg-amber-",
  "border-amber-",
  "from-blue-",
  "to-indigo-",
  "from-amber-",
  "to-orange-",
] as const;

describe("education visual SSOT", () => {
  it("keeps migrated Education UI owners versioned and territorial", () => {
    for (const relativePath of EDUCATION_VISUAL_OWNERS) {
      const absolutePath = path.join(ROOT, relativePath);
      expect(fs.existsSync(absolutePath), relativePath).toBe(true);
      const source = fs.readFileSync(absolutePath, "utf8");

      expect(source, relativePath).toContain("territory-");
      for (const token of LEGACY_VISUAL_TOKENS) {
        expect(source, `${relativePath}: legacy visual token returned: ${token}`).not.toContain(token);
      }
    }
  });

  it("keeps Education paused while its owners are hardened for later activation", () => {
    expect(PRODUCT_MODULE_REGISTRY.education.status).toBe("paused");
  });
});
