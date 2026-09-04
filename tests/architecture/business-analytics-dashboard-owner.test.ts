import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const CORE_ANALYTICS = join(
  ROOT,
  "src",
  "core",
  "business",
  "components",
  "AnalyticsDashboard.tsx",
);
const MODULE_ANALYTICS = join(
  ROOT,
  "src",
  "modules",
  "business",
  "components",
  "AnalyticsDashboard.tsx",
);
const ACTIVE_PAGE = join(ROOT, "src", "app", "pages", "DashboardEmpresaPage.tsx");
const MODULE_BARREL = join(
  ROOT,
  "src",
  "modules",
  "business",
  "components",
  "index.ts",
);

describe("G6 Business analytics dashboard ownership", () => {
  it("renders the real analytics implementation from the canonical core owner", () => {
    const coreSource = readFileSync(CORE_ANALYTICS, "utf8");
    const pageSource = readFileSync(ACTIVE_PAGE, "utf8");

    expect(pageSource).toContain(
      'import("@/core/business/components/AnalyticsDashboard")',
    );
    expect(coreSource).toContain("getBusinessAnalyticsSummary");
    expect(coreSource).toContain('useState<BusinessAnalyticsPeriod>("week")');
    expect(coreSource).not.toContain("Analytics em breve");
  });

  it("does not recreate the retired module analytics dashboard", () => {
    expect(existsSync(MODULE_ANALYTICS)).toBe(false);
    expect(readFileSync(MODULE_BARREL, "utf8")).not.toContain(
      '"./AnalyticsDashboard"',
    );
  });
});
