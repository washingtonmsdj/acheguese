import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

function read(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

describe("Business edit flow (G6)", () => {
  it("keeps Business editing inside the canonical Central management tree", () => {
    const routeSsot = read("src/core/business/utils/businessManagementRoutes.ts");
    const urls = read("src/core/business/hooks/useBusinessUrls.ts");
    const workspace = read(
      "src/core/profiles/services/profile.workspace.business-modules.ts",
    );
    const centralRoutes = read("src/app/routes/sections/CentralRoutes.tsx");
    const appRoutes = read("src/app/routes/sections/AppLayoutRoutes.tsx");
    const activeCentralLazy = read("src/app/routes/activeCentralLazyImports.ts");
    const appLazy = read("src/app/routes/lazyImports.ts");
    const registry = read("tools/architecture/architecture-registry.ts");
    const profileRuntime = read(
      "src/core/profiles/contexts/multi-profile-runtime-context.tsx",
    );

    expect(routeSsot).toContain(
      'edit: (businessId: string) => `/central/empresas/${cleanRouteSegment(businessId, "business id")}/editar`',
    );
    expect(urls).toContain(
      "edit: (businessId: string) => businessManagementRoutes.edit(businessId)",
    );
    expect(workspace).toContain(
      "editUrl: businessManagementRoutes.edit(business.id)",
    );

    expect(centralRoutes).toContain(
      '<Route path="editar" element={<P.EditarEmpresaPage />} />',
    );
    expect(centralRoutes).toContain('isProductModuleEnabled("business")');
    expect(centralRoutes).toContain('path="empresas"');
    expect(centralRoutes).toContain('element={<P.CentralEmpresasPage />}');
    expect(centralRoutes).toContain('path="empresas/nova"');
    expect(centralRoutes).toContain('element={<P.CriarEmpresaPage />}');
    expect(centralRoutes).toContain('path="empresas/:businessId"');
    expect(centralRoutes).toContain('element={<P.BusinessAdminGuard />}');
    expect(centralRoutes).not.toContain("launchElement");
    expect(activeCentralLazy).toContain("export const EditarEmpresaPage = lazy(");
    expect(appRoutes).not.toContain("/edit-business");
    expect(appLazy).not.toContain("EditarEmpresaPage");
    expect(profileRuntime).not.toContain("/edit-business");

    for (const retiredRoute of [
      "/create-business",
      "/edit-business/:profileId",
      "/dashboard/business/:profileId",
    ]) {
      expect(registry, retiredRoute).not.toContain(retiredRoute);
    }

    expect(registry).toContain('"/central/empresas/:businessId/editar"');
  });

  it("keeps authenticated Business E2E on the route SSOT instead of retired literals", () => {
    const authBusiness = read("tests/e2e/auth-business.spec.ts");
    const lifecycle = read("tests/e2e/business-lifecycle-authenticated.spec.ts");

    expect(authBusiness).toContain(
      "businessManagementRoutes.edit(createdBusiness.profile_id)",
    );
    expect(lifecycle).toContain("businessManagementRoutes.edit(profileId!)");
    expect(authBusiness).not.toContain("/edit-business/");
    expect(lifecycle).not.toContain("/edit-business/");
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
