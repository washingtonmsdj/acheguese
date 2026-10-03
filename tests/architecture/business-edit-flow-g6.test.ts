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
    const activeAppLazy = read("src/app/routes/activeLazyImports.ts");
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
    expect(centralRoutes).toContain("CentralEmpresasPage billingEnabled={billingEnabled}");
    expect(centralRoutes).toContain('path="empresas/nova"');
    expect(centralRoutes).toContain("<P.CriarEmpresaPage");
    expect(centralRoutes).toContain(
      "enabledVerticalKeys={activeBusinessVerticalKeys}",
    );
    expect(centralRoutes).toContain('path="empresas/:businessId"');
    expect(centralRoutes).toContain('element={<P.BusinessAdminGuard />}');
    expect(centralRoutes).not.toContain("launchElement");
    expect(activeCentralLazy).toContain("export const EditarEmpresaPage = lazy(");
    expect(appRoutes).not.toContain("/edit-business");
    expect(activeAppLazy).not.toContain("EditarEmpresaPage");
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

  it("projects the active editor from the canonical territory visual SSOT", () => {
    const editorCss = read("src/modules/business/pages/EditarEmpresaPage.css");

    for (const legacyPrimitive of [
      "var(--primary)",
      "var(--card)",
      "var(--border)",
      "var(--foreground)",
      "var(--muted)",
      "var(--muted-foreground)",
    ]) {
      expect(editorCss).not.toContain(legacyPrimitive);
    }

    for (const territoryToken of [
      "var(--territory-brand)",
      "var(--territory-surface)",
      "var(--territory-surface-raised)",
      "var(--territory-border)",
      "var(--territory-ink)",
      "var(--territory-muted)",
      "var(--territory-focus)",
    ]) {
      expect(editorCss).toContain(territoryToken);
    }

    const innerVisualConsumers = [
      "src/core/business/components/SettingsTab.tsx",
      "src/modules/business/components/edit/BasicInfoStep.tsx",
      "src/modules/business/components/edit/ContactStep.tsx",
      "src/modules/business/components/edit/ExtrasStep.tsx",
      "src/modules/business/components/edit/StepProgress.tsx",
    ];

    for (const relativePath of innerVisualConsumers) {
      const content = read(relativePath);

      for (const genericUtility of [
        "bg-primary",
        "text-primary",
        "border-primary",
        "border-border",
        "bg-card",
        "text-foreground",
        "text-muted-foreground",
        "bg-background",
        "bg-muted",
        "ring-ring",
      ]) {
        expect(content, `${relativePath}: ${genericUtility}`).not.toContain(genericUtility);
      }

      expect(content, `${relativePath}: territory surface`).toContain("territory-surface");
      expect(content, `${relativePath}: territory border`).toContain("territory-border");
      expect(content, `${relativePath}: territory ink`).toContain("territory-ink");
      expect(content, `${relativePath}: territory brand`).toContain("territory-brand");
    }
  });
});
