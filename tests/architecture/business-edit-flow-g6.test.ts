import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

function read(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

describe("Business edit flow (G6)", () => {
  it("keeps the edit route in the business management SSOT", () => {
    const routes = read("src/core/business/utils/businessManagementRoutes.ts");
    const urls = read("src/core/business/hooks/useBusinessUrls.ts");
    const workspace = read(
      "src/core/profiles/services/profile.workspace.business-modules.ts",
    );

    expect(routes).toContain(
      'edit: (businessId: string) => `/edit-business/${cleanRouteSegment(businessId, "business id")}`',
    );
    expect(urls).toContain(
      "edit: (businessId: string) => businessManagementRoutes.edit(businessId)",
    );
    expect(workspace).toContain(
      "editUrl: businessManagementRoutes.edit(business.id)",
    );
  });

  it("routes dashboard edit CTAs to the real editor instead of the read-only details page", () => {
    const details = read(
      "src/modules/business/dashboard/pages/BusinessDetailsPage.tsx",
    );
    const ads = read(
      "src/modules/business/dashboard/pages/BusinessAdsPage.tsx",
    );
    const settings = read(
      "src/modules/business/dashboard/pages/BusinessSettingsPage.tsx",
    );

    expect(details).toContain(
      "to={businessManagementRoutes.edit(businessId)}",
    );
    expect(details).toContain("Editar dados");
    expect(ads).toContain("to={businessManagementRoutes.edit(businessId)}");
    expect(ads).not.toContain(
      '<Link to={businessManagementRoutes.dados(businessId)}>\n              <Button variant="outline" size="sm">\n                Editar dados',
    );
    expect(settings).toContain(
      "navigate(businessManagementRoutes.edit(businessId))",
    );
  });
});
