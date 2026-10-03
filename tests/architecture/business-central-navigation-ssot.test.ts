import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getActiveBusinessManagementNavigation } from "../../src/app/config/businessManagementSurfaceScope";
import * as lifecycle from "../../src/app/config/lifecycleRegistry";

afterEach(() => vi.restoreAllMocks());

describe("Business Central navigation certification", () => {
  it("exposes exactly eight certified real management routes, in order", () => {
    const items = getActiveBusinessManagementNavigation();
    expect(items.map((item) => item.id)).toEqual([
      "overview",
      "edit",
      "photos",
      "hours",
      "location",
      "catalog",
      "dados",
      "configuracoes",
    ]);
    const routes = readFileSync(
      "src/app/routes/sections/CentralRoutes.tsx",
      "utf8",
    );
    const paths = [...routes.matchAll(/path="([^"]+)"/g)].map(
      (match) => match[1],
    );
    for (const item of items) {
      expect(item.owner).toBe("business");
      expect(item.group).toBe("management");
      expect(item.buildRoute("real-id")).toBe(
        `/central/empresas/real-id${item.routePath ? "/" + item.routePath : ""}`,
      );
      if (item.routePath) expect(paths).toContain(item.routePath);
      else
        expect(routes).toMatch(
          /<Route\s+index\s+element={[\s\S]*?<P.BusinessOverviewPage/,
        );
    }
    expect(paths).toEqual([
      "empresas",
      "empresas/nova",
      "empresas/:businessId",
      "editar",
      "fotos",
      "horarios",
      "localizacao",
      "produtos-servicos",
      "dados",
      "configuracoes",
      "*",
    ]);
  });

  it("fails closed when Business or Central is disabled", () => {
    vi.spyOn(lifecycle, "isProductModuleEnabled").mockReturnValue(false);
    expect(getActiveBusinessManagementNavigation()).toEqual([]);
    vi.restoreAllMocks();
    vi.spyOn(lifecycle, "isPlatformCapabilityEnabled").mockReturnValue(false);
    expect(getActiveBusinessManagementNavigation()).toEqual([]);
  });

  it("keeps all active Business management pages on the canonical title token", () => {
    const activePageFiles = [
      "src/modules/business/dashboard/pages/BusinessOverviewPage.tsx",
      "src/modules/business/pages/EditarEmpresaPage.tsx",
      "src/modules/business/dashboard/pages/BusinessPhotosPage.tsx",
      "src/modules/business/dashboard/pages/BusinessOpeningHoursPage.tsx",
      "src/modules/business/dashboard/pages/BusinessLocationPage.tsx",
      "src/modules/business/dashboard/pages/BusinessCatalogPage.tsx",
      "src/modules/business/dashboard/pages/BusinessDetailsPage.tsx",
      "src/modules/business/dashboard/pages/BusinessSettingsPage.tsx",
    ];

    for (const file of activePageFiles) {
      expect(readFileSync(file, "utf8")).toContain("business-management-title");
    }
  });

  it("keeps the management shell as the sole runtime navigation owner", () => {
    const locationPage = readFileSync(
      "src/modules/business/dashboard/pages/BusinessLocationPage.tsx",
      "utf8",
    );

    expect(locationPage).toContain("showIdentity={false}");
    expect(locationPage).toContain("showSteps={false}");
    expect(locationPage).toContain("showSteps = showIdentity");
    expect(locationPage).not.toContain("<h1>4. Localização</h1>");
    expect(locationPage).not.toContain("window.confirm");
  });

  it("uses one registry for the desktop/mobile shell and no nested domain inbox", () => {
    const routes = readFileSync(
      "src/app/routes/sections/CentralRoutes.tsx",
      "utf8",
    );
    const shell = readFileSync(
      "src/modules/business/dashboard/pages/BusinessDashboardShellPage.tsx",
      "utf8",
    );
    expect(routes).toContain(
      "navigationItems={getActiveBusinessManagementNavigation()}",
    );
    expect(shell).toContain("navigationItems.map");
    expect(shell).not.toContain("const navItems: NavItem[]");
    expect(routes).not.toMatch(
      /path="(mensagens|avaliacoes|estatisticas|analytics|planos)"/,
    );
  });
  it("preserves canonical territory data required by owner public-page actions", () => {
    const queries = readFileSync(
      "src/core/profiles/services/profile.external-data.queries.ts",
      "utf8",
    );
    const mapper = readFileSync(
      "src/core/profiles/services/profile.service.rules.ts",
      "utf8",
    );
    const snapshot = readFileSync(
      "src/core/profiles/services/profile.workspace.business-modules.ts",
      "utf8",
    );

    expect(queries).toContain("profiles(name, neighborhood, city)");
    expect(queries).toContain(
      "location:locations!location_id(geographic_path)",
    );
    expect(queries).toContain(
      "geographic_path: firstRelation(location)?.geographic_path ?? null",
    );
    expect(mapper).toContain(
      "geographic_path: business.geographic_path || null",
    );
    expect(snapshot).toContain(
      "business.slug && business.geographic_path",
    );
  });

  it("excludes deleted companies from the active owner workspace", () => {
    const queries = readFileSync(
      "src/core/profiles/services/profile.external-data.queries.ts",
      "utf8",
    );
    const start = queries.indexOf(
      "export async function getUserBusinessesByProfilesQuery",
    );
    const end = queries.indexOf(
      "export async function getUserBusinessesQuery",
      start,
    );

    expect(start).toBeGreaterThanOrEqual(0);
    expect(end).toBeGreaterThan(start);
    const ownerWorkspaceQuery = queries.slice(start, end);
    expect(ownerWorkspaceQuery).toContain('.neq("status", "deleted")');
    expect(ownerWorkspaceQuery).not.toContain('.eq("status", "active")');
  });

});