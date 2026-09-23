import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const appLazyImports = readFileSync(
  "src/app/routes/lazyImports.ts",
  "utf8",
);
const adminLazyImports = readFileSync(
  "src/app/routes/adminLazyImports.ts",
  "utf8",
);
const adminRoutes = readFileSync(
  "src/app/routes/sections/AdminRoutes.tsx",
  "utf8",
);
const adminSurfaceScope = readFileSync(
  "src/app/config/adminSurfaceScope.ts",
  "utf8",
);
const adminNavigation = readFileSync(
  "src/modules/admin/config/adminNavigation.config.ts",
  "utf8",
);
const adminLayout = readFileSync(
  "src/modules/admin/pages/AdminLayout.tsx",
  "utf8",
);

describe("admin paused navigation boundary", () => {
  it("keeps the admin tree owned only by adminLazyImports", () => {
    expect(appLazyImports).not.toMatch(/export const Admin[A-Z]/);
    expect(appLazyImports).not.toContain("LocationsAdminPage");
    expect(adminLazyImports).toContain("export const AdminLayout");
    expect(adminLazyImports).toContain("export const LocationsAdminPage");
    expect(adminLazyImports).toContain("export const AdminGuideTouristPointsPage");
    expect(adminLazyImports).toContain("export const AdminGuideTouristPointFormPage");
  });

  it("uses one lifecycle owner for admin routes and navigation", () => {
    expect(adminSurfaceScope).toContain("ADMIN_SURFACE_SCOPE");
    expect(adminSurfaceScope).toContain("isProductModuleEnabled");
    expect(adminSurfaceScope).toContain("isPlatformCapabilityEnabled");
    expect(adminSurfaceScope).toContain("filterAdminNavigationSections");
    expect(adminSurfaceScope).toContain(
      'gastronomia: { kind: "product", module: "gastronomy" }',
    );
    expect(adminSurfaceScope).toContain(
      'classificados: { kind: "product", module: "classifieds" }',
    );
    expect(adminSurfaceScope).toContain(
      'mensagens: {\n    kind: "paused"',
    );

    expect(adminRoutes).toContain("filterAdminNavigationSections");
    expect(adminRoutes).toContain("isAdminSurfaceEnabled");
    expect(adminRoutes).toContain('adminRoute("gastronomia"');
    expect(adminRoutes).toContain('adminRoute("services"');
    expect(adminRoutes).toContain('adminRoute("classificados"');
    expect(adminRoutes).toContain('adminRoute("vagas"');
    expect(adminRoutes).toContain('adminRoute("eventos"');
    expect(adminRoutes).toContain('adminRoute("motoristas"');
    expect(adminRoutes).toContain('adminRoute("pontos-turisticos"');
    expect(adminRoutes).toContain(
      "navigationSections={adminNavigationSections}",
    );
    expect(adminRoutes).not.toContain('path="alertas"');
    expect(adminRoutes).not.toContain('path="community-interest"');
    expect(adminNavigation).not.toContain('/admin/alertas');
  });

  it("removes duplicated paused inventories and keeps preserved pages lazy", () => {
    expect(adminNavigation).not.toContain("ADMIN_PAUSED_NAV_ITEM_IDS");
    expect(adminNavigation).not.toContain("ADMIN_VISIBLE_NAV_SECTIONS");
    expect(adminNavigation).not.toContain("getAdminNavItems");
    expect(adminLayout).toContain("navigationSections.map");
    expect(adminLayout).not.toContain("ADMIN_VISIBLE_NAV_SECTIONS");

    expect(adminLazyImports).not.toContain("createLaunchPausedRoute");
    expect(adminLazyImports).toContain(
      'import("@/modules/admin/pages/AdminGastronomia")',
    );
    expect(adminLazyImports).toContain(
      'import("@/modules/admin/pages/AdminClassificados")',
    );
    expect(adminLazyImports).toContain(
      'import("@/modules/admin/pages/AdminMensagens")',
    );
  });
});
