import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const pathOf = (path: string) => resolve(root, path);
const read = (path: string) => readFileSync(pathOf(path), "utf8");

const retiredRuntimePaths = [
  "src/app/pages/DashboardEmpresaPage.tsx",
  "src/core/business/components/EmpresaDashboardTab.tsx",
  "src/core/business/components/NetworkTab.tsx",
  "src/core/business/components/SubscriptionPlans.tsx",
  "src/core/business/components/AnalyticsDashboard.tsx",
  "src/core/business/components/CouponManager.tsx",
  "src/core/business/hooks/useDashboardTabs.ts",
  "src/shared/components/dashboard/DashboardBreadcrumb.tsx",
  "src/shared/components/dashboard/DashboardHeader.tsx",
  "src/shared/components/dashboard/DashboardTabs.tsx",
  "src/shared/components/dashboard/index.ts",
] as const;

describe("MVP Business dashboard legacy shell retirement", () => {
  it("keeps the callerless legacy dashboard shell and exclusive helpers retired", () => {
    for (const path of retiredRuntimePaths) {
      expect(existsSync(pathOf(path)), path).toBe(false);
    }
  });

  it("keeps routing on the canonical Business dashboard tree", () => {
    const lazyImports = read("src/app/routes/lazyImports.ts");
    const centralRoutes = read("src/app/routes/sections/CentralRoutes.tsx");
    const activeCentralLazyImports = read("src/app/routes/activeCentralLazyImports.ts");

    expect(lazyImports).not.toContain("DashboardEmpresaPage");
    expect(centralRoutes).toContain('path="empresas/:businessId"');
    expect(centralRoutes).toContain('element={<P.BusinessAdminGuard />}');
    expect(centralRoutes).not.toContain("launchElement");
    expect(centralRoutes).toContain("<P.BusinessDashboardShellPage />");
    expect(centralRoutes).toContain("<P.BusinessOverviewPage />");
    expect(activeCentralLazyImports).toContain(
      'import("@/modules/business/dashboard/pages/BusinessDashboardShellPage")',
    );
    expect(activeCentralLazyImports).toContain(
      'import("@/modules/business/dashboard/pages/BusinessOverviewPage")',
    );
  });

  it("keeps the core barrel and shared types free from retired presentation ownership", () => {
    const coreBusiness = read("src/core/business/index.ts");
    const dashboardTypes = read("src/shared/types/dashboard.ts");

    expect(coreBusiness).not.toContain("NetworkTab");
    expect(dashboardTypes).toContain("export interface AccessPermissions");
    expect(dashboardTypes).not.toContain("BusinessData");
    expect(dashboardTypes).not.toContain("DashboardTab");
    expect(dashboardTypes).not.toContain("DashboardStats");
    expect(dashboardTypes).not.toContain("MemberData");
  });
});
